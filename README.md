# Material Explorer

Welcome to Material Explorer! This application allows you to interactively create, customize, and visualize materials in 3D. Leveraging the power of React Three Fiber, it offers real-time feedback on changes to material properties such as color, metalness, and roughness. The app is designed to be responsive and user-friendly, ensuring a seamless experience across various devices and screen sizes.

## Features

* **Dynamic Material Customization**: Create, edit, and delete materials with immediate visual feedback
* **Live 3D Preview**: Utilize WebGL through React Three Fiber for a live 3D preview of the materials
* **Responsive Design**: Experience a fully responsive UI that adapts to different screen sizes and devices
* **State Persistence**: Your material configurations are saved in local storage, so you can pick up where you left off
* **Interactive UI**: Manage screen real estate efficiently with a collapsible sidebar

## Prerequisites

- Node.js (version 16.x or higher)
- npm (comes with Node.js)

## Installation

To run Material Explorer locally, follow these steps:

1. Clone the repository:
   ```bash
   git clone https://github.com/mikechaves/material-explorer.git
   ```

2. Navigate to the project directory:
   ```bash
   cd material-explorer
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

## Running the App

To start the development server:

```bash
npm start
```

This will open the app in your default web browser at `http://localhost:3000`. The app will automatically reload if you make changes to the source code.

## Building for Production

To create a production build:

```bash
npm run build
```

This command builds the app for production to the `build` folder. The build is minified and the filenames include hashes for cache management.

## Usage

### Creating a Material
- Use the controls in the sidebar to set the material's color, metalness, and roughness
- Click "Save Material" to add the material to your collection

### Editing a Material
- Click "Edit" next to any material in the sidebar to load it into the editor
- Adjust the material's properties as desired and click "Save Material" to update it

### Deleting a Material
- Click "Delete" next to any material in the sidebar to remove it from your collection

### Viewing Materials
- The 3D preview in the center of the screen will update in real-time as you adjust the material properties
- Collapse or expand the sidebar to toggle between a wider view of the 3D preview and the material list

## Technologies Used

- React 18
- Three.js
- React Three Fiber
- TypeScript
- Tailwind CSS

## Contributing

Contributions to Material Explorer are welcome! Please follow these steps:

1. Fork the repository
2. Create a new branch for your feature
3. Make your changes
4. Submit a pull request

## Troubleshooting

If you encounter the OpenSSL error when starting the development server, the project is configured to use the legacy OpenSSL provider. No additional configuration should be needed.

## License

Material Explorer is released under the MIT License. See the [LICENSE](LICENSE) file for more information.
