import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Typography,
  Chip,
  Alert,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Save as SaveIcon,
  FolderOpen as LoadIcon,
  Delete as DeleteIcon,
  MoreVert as MoreIcon,
} from '@mui/icons-material';
import type { ConnectionProfile, DatabaseConfig } from '../types';
import { 
  saveConnectionProfiles, 
  loadConnectionProfiles, 
  createConnectionProfile,
  profileToDatabaseConfig,
  updateProfileLastUsed 
} from '../utils/databaseUtils';

interface ConnectionProfileManagerProps {
  currentConfig: DatabaseConfig;
  onLoadProfile: (config: DatabaseConfig) => void;
  disabled?: boolean;
}

const ConnectionProfileManager: React.FC<ConnectionProfileManagerProps> = ({
  currentConfig,
  onLoadProfile,
  disabled = false,
}) => {
  const [profiles, setProfiles] = useState<ConnectionProfile[]>([]);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedProfile, setSelectedProfile] = useState<ConnectionProfile | null>(null);

  // Load profiles on component mount
  useEffect(() => {
    const loadedProfiles = loadConnectionProfiles();
    setProfiles(loadedProfiles);
  }, []);

  // Save current configuration as a new profile
  const handleSaveProfile = () => {
    if (!profileName.trim()) return;

    const newProfile = createConnectionProfile(currentConfig, profileName.trim());
    const updatedProfiles = [...profiles, newProfile];
    
    setProfiles(updatedProfiles);
    saveConnectionProfiles(updatedProfiles);
    setSaveDialogOpen(false);
    setProfileName('');
  };

  // Load a selected profile
  const handleLoadProfile = (profile: ConnectionProfile) => {
    const config = profileToDatabaseConfig(profile);
    onLoadProfile(config);
    updateProfileLastUsed(profile.id);
    
    // Update profiles to reflect last used
    const updatedProfiles = profiles.map(p => 
      p.id === profile.id ? { ...p, lastUsed: new Date() } : p
    );
    setProfiles(updatedProfiles);
    saveConnectionProfiles(updatedProfiles);
  };

  // Delete a profile
  const handleDeleteProfile = (profileId: string) => {
    const updatedProfiles = profiles.filter(p => p.id !== profileId);
    setProfiles(updatedProfiles);
    saveConnectionProfiles(updatedProfiles);
    setMenuAnchor(null);
    setSelectedProfile(null);
  };

  // Get database type color
  const getDatabaseTypeColor = (type: string) => {
    switch (type) {
      case 'mysql': return '#00758f';
      case 'postgresql': return '#336791';
      case 'mssql': return '#cc2927';
      default: return '#666';
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {/* Action Buttons */}
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Button
          variant="outlined"
          size="small"
          startIcon={<SaveIcon />}
          onClick={() => setSaveDialogOpen(true)}
          disabled={disabled}
          sx={{ fontSize: '0.75rem', py: 0.5 }}
        >
          Save Profile
        </Button>
        
        <Button
          variant="outlined"
          size="small"
          startIcon={<LoadIcon />}
          disabled={profiles.length === 0}
          sx={{ fontSize: '0.75rem', py: 0.5 }}
        >
          Load Profile ({profiles.length})
        </Button>
      </Box>

      {/* Saved Profiles List */}
      {profiles.length > 0 && (
        <Box sx={{ 
          maxHeight: 200, 
          overflow: 'auto',
          border: '1px solid #e0e0e0',
          borderRadius: 1,
          backgroundColor: 'grey.50'
        }}>
          <List dense>
            {profiles.map((profile) => (
              <ListItem
                key={profile.id}
                sx={{ 
                  py: 0.5,
                  '&:hover': { backgroundColor: 'action.hover' }
                }}
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 'bold' }}>
                        {profile.name}
                      </Typography>
                      <Chip 
                        label={profile.type.toUpperCase()} 
                        size="small" 
                        sx={{ 
                          fontSize: '0.7rem',
                          backgroundColor: getDatabaseTypeColor(profile.type),
                          color: 'white',
                          height: 18
                        }} 
                      />
                    </Box>
                  }
                  secondary={
                    <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                      {profile.host}:{profile.port}/{profile.database}
                      {profile.lastUsed && (
                        <span> • Last used: {new Date(profile.lastUsed).toLocaleDateString()}</span>
                      )}
                    </Typography>
                  }
                />
                <ListItemSecondaryAction>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Button
                      size="small"
                      onClick={() => handleLoadProfile(profile)}
                      disabled={disabled}
                      sx={{ fontSize: '0.7rem', minWidth: 'auto', px: 1 }}
                    >
                      Load
                    </Button>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        setMenuAnchor(e.currentTarget);
                        setSelectedProfile(profile);
                      }}
                    >
                      <MoreIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </Box>
      )}

      {/* Save Profile Dialog */}
      <Dialog open={saveDialogOpen} onClose={() => setSaveDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontSize: '1rem', fontWeight: 'bold' }}>
          Save Connection Profile
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Profile Name"
            value={profileName}
            onChange={(e) => setProfileName(e.target.value)}
            placeholder="Enter a name for this connection profile"
            sx={{ 
              mt: 1,
              '& .MuiInputBase-input': { fontSize: '0.8rem' },
              '& .MuiInputLabel-root': { fontSize: '0.8rem' }
            }}
          />
          <Alert severity="info" sx={{ mt: 2, fontSize: '0.8rem' }}>
            This will save your current database configuration as a reusable profile. 
            Passwords will be encrypted before saving.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveDialogOpen(false)} size="small">
            Cancel
          </Button>
          <Button 
            onClick={handleSaveProfile} 
            variant="contained" 
            size="small"
            disabled={!profileName.trim()}
          >
            Save Profile
          </Button>
        </DialogActions>
      </Dialog>

      {/* Profile Actions Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
      >
        <MenuItem 
          onClick={() => {
            if (selectedProfile) {
              handleDeleteProfile(selectedProfile.id);
            }
          }}
          sx={{ fontSize: '0.8rem' }}
        >
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete Profile
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default ConnectionProfileManager;
