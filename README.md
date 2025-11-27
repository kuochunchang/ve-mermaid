# Mermaid Viewer

## Features

- **Real-time Preview**: Instantly see your diagram updates as you type.
- **Multi-tab Support**: Work on multiple diagrams simultaneously.
- **Local Storage**: All your diagrams are automatically saved to your browser's local storage. Your data never leaves your device.
- **Resizable Panes**: Adjust the width of the editor and preview panes to suit your workflow.
- **Zoom Controls**: Easily zoom in and out of complex diagrams.
- **Material Design**: Clean and intuitive user interface with Material Design elements.
- **Chinese Text Support**: Optimized configuration for rendering long Chinese text labels.

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/mermaid-viewer.git
   cd mermaid-viewer
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`.

## Usage

- **Creating a New Diagram**: Click the `+` button in the tab bar.
- **Renaming a Tab**: Double-click on the tab name to rename it.
- **Closing a Tab**: Click the `×` button on the tab (if there is more than one tab).
- **Resizing**: Drag the divider between the editor and preview panes.
- **Zooming**: Use the `+` and `-` buttons in the bottom right corner of the preview pane.
- **About**: Click the `info` icon in the top right corner to view application information.

## Deployment

This is a static web application that can be deployed for **free** on various platforms. Here are the recommended options:

### Option 1: Vercel (Recommended - Easiest)

**Zero configuration required!**

1. Visit [vercel.com](https://vercel.com) and sign in with GitHub
2. Click "New Project" and import your repository
3. Vercel will auto-detect the Vite configuration
4. Click "Deploy"

That's it! Your app will be live with a URL like `https://your-app.vercel.app`.
*Note: The project is configured to work automatically on Vercel (serving from root `/`) while still supporting GitHub Pages (serving from subpath).*

### Option 2: GitHub Pages with GitHub Actions (Recommended for Automation)

**Automatic deployment on every push to main branch!**

1. Enable GitHub Pages in your repository:
   - Go to Settings → Pages
   - Under "Source", select "GitHub Actions"

2. Update `vite.config.ts` with your repository name:
   ```typescript
   export default defineConfig({
     plugins: [vue()],
     base: process.env.NODE_ENV === 'production' ? '/your-repo-name/' : '/',
   })
   ```

3. Push to main branch:
   ```bash
   git add .
   git commit -m "Setup GitHub Actions deployment"
   git push origin main
   ```

The GitHub Actions workflow (`.github/workflows/deploy.yml`) will automatically:
- Build your application
- Deploy to GitHub Pages
- Your site will be live at `https://yourusername.github.io/your-repo-name/`

### Option 3: GitHub Pages (Manual Deployment)

1. Install gh-pages:
   ```bash
   npm install --save-dev gh-pages
   ```

2. Add deploy script to `package.json`:
   ```json
   {
     "scripts": {
       "deploy": "vite build && gh-pages -d dist"
     }
   }
   ```

3. Update `vite.config.ts` to set the base path:
   ```typescript
   export default defineConfig({
     base: '/your-repo-name/',
     // ... rest of config
   })
   ```

4. Deploy:
   ```bash
   npm run deploy
   ```

5. Enable GitHub Pages in your repository settings (Settings → Pages → Source: gh-pages branch)

### Option 4: Netlify

1. Sign in to [netlify.com](https://netlify.com) with GitHub
2. Click "Add new site" → "Import an existing project"
3. Select your repository
4. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
5. Click "Deploy"

### Option 5: Cloudflare Pages

1. Sign in to [Cloudflare Pages](https://pages.cloudflare.com)
2. Create a new project and connect to your Git repository
3. Build settings:
   - Build command: `npm run build`
   - Build output directory: `dist`
4. Click "Save and Deploy"

All options are **100% free** for static sites with no backend requirements.

## Technologies Used

- [Vue 3](https://vuejs.org/) - The Progressive JavaScript Framework
- [Vite](https://vitejs.dev/) - Next Generation Frontend Tooling
- [Mermaid.js](https://mermaid.js.org/) - JavaScript based diagramming and charting tool
- [Material Icons](https://fonts.google.com/icons) - Material Design icons

## License

This project is open source and available under the [MIT License](LICENSE).
