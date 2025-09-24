# 🚀 Hackoholics Configuration Dashboard

A modern, responsive React application for managing API configurations, database connections, field mappings, and testing workflows. Built with Material-UI and TypeScript for a professional development experience.

![React](https://img.shields.io/badge/React-19.1.1-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue.svg)
![Material-UI](https://img.shields.io/badge/Material--UI-7.3.2-blue.svg)
![Vite](https://img.shields.io/badge/Vite-7.1.2-646CFF.svg)

## ✨ Features

### 🎯 Single-Screen Dashboard
- **Unified Interface**: All configuration tools in one optimized screen
- **Responsive Design**: Adapts seamlessly to different screen sizes
- **Real-time Status**: Live configuration status indicators
- **Progress Tracking**: Visual progress bar showing completion percentage

### 🔧 Configuration Management
- **API Configuration**: Set up endpoints, timeouts, and headers
- **Database Configuration**: Configure connections, credentials, and SSL
- **Field Mapping**: Map source fields to target fields with drag-and-drop
- **Testing & Validation**: Comprehensive testing suite with modal interface

### 🎨 Modern UI/UX
- **Material-UI Components**: Professional, accessible design system
- **Compact Layout**: Optimized for maximum screen utilization
- **Scrollable Content**: Handles overflow gracefully
- **Modal Testing**: Full-width testing interface that doesn't disrupt workflow

## 🛠️ Tech Stack

### Core Technologies
- **React 19.1.1** - Modern React with latest features
- **TypeScript 5.8.3** - Type-safe development
- **Vite 7.1.2** - Fast build tool and dev server

### UI & Styling
- **Material-UI 7.3.2** - Google's Material Design components
- **@mui/icons-material** - Comprehensive icon library
- **Emotion** - CSS-in-JS styling solution

### Form Management & HTTP
- **React Hook Form 7.63.0** - Performant form handling
- **Axios 1.12.2** - HTTP client for API requests

### Additional Features
- **React Router DOM 7.9.1** - Client-side routing
- **React DnD 16.0.1** - Drag and drop functionality
- **Crypto-js 4.2.0** - Encryption utilities

## 📦 Installation

### Prerequisites
- **Node.js** (v18 or higher recommended)
- **npm** or **yarn** package manager

### Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd hackoholics
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173` (or the URL shown in your terminal)

### Available Scripts

```bash
# Development server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run ESLint for code quality
npm run lint
```

## 🏗️ Project Structure

```
src/
├── components/          # React components
│   ├── Home.tsx        # Main dashboard component
│   ├── ApiConfig.tsx   # API configuration form
│   ├── DatabaseConfig.tsx # Database configuration form
│   ├── Mapping.tsx     # Field mapping interface
│   └── Testing.tsx     # Testing and validation
├── contexts/           # React Context providers
│   └── AppContext.tsx  # Global state management
├── types/              # TypeScript type definitions
│   └── index.ts        # Interface definitions
├── services/           # API services (ready for implementation)
├── utils/              # Utility functions (ready for implementation)
├── assets/             # Static assets
└── main.tsx           # Application entry point
```

## 🎯 Usage Guide

### 1. API Configuration
- Set your API base URL and timeout settings
- Configure authentication headers
- Save configuration to enable API testing

### 2. Database Configuration
- Enter database connection details
- Configure host, port, database name, and credentials
- Enable SSL if required

### 3. Field Mapping
- Add source fields from your data source
- Add target fields for your destination
- Fields will be available for mapping operations

### 4. Testing & Validation
- Click "Open Testing" to access the full-width modal
- Run comprehensive tests on your configurations
- View detailed results and status indicators

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the root directory for environment-specific settings:

```env
VITE_API_BASE_URL=https://your-api-endpoint.com
VITE_DB_CONNECTION_STRING=your-db-connection-string
```

### Customization
- **Theme**: Modify Material-UI theme in `src/App.tsx`
- **Components**: Customize component styles using the `sx` prop
- **Layout**: Adjust responsive breakpoints in component files

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Static Hosting
The built files in the `dist/` directory can be deployed to any static hosting service:
- **Vercel**: `vercel --prod`
- **Netlify**: Drag and drop the `dist/` folder
- **GitHub Pages**: Use GitHub Actions for automated deployment

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## 📝 Development Notes

### Code Quality
- **ESLint**: Configured for React and TypeScript best practices
- **TypeScript**: Strict type checking enabled
- **Material-UI**: Consistent design system implementation

### Performance
- **Vite**: Fast development server and optimized builds
- **React Hook Form**: Efficient form state management
- **Lazy Loading**: Components loaded on demand

### Accessibility
- **Material-UI**: Built-in accessibility features
- **Keyboard Navigation**: Full keyboard support
- **Screen Readers**: Proper ARIA labels and semantic HTML

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **Material-UI Team** for the excellent component library
- **Vite Team** for the fast build tool
- **React Team** for the amazing framework

---

**Happy Coding! 🎉**

For questions or support, please open an issue or contact the development team.