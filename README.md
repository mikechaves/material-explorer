# Material Explorer

Welcome to the Material Explorer app documentation. This document provides detailed instructions on how to install, run, and use the app effectively, as well as an overview of its features.

## Overview

Material Explorer is a React-based application that allows users to interactively create, customize, and visualize materials in 3D. Leveraging the power of React Three Fiber, it offers real-time feedback on changes to material properties such as color, metalness, and roughness. The app is designed to be responsive and user-friendly, ensuring a seamless experience across various devices and screen sizes.

## Features

- **Dynamic Material Customization**: Create, edit, and delete materials with immediate visual feedback.
- **Live 3D Preview**: Utilize WebGL through React Three Fiber for a live 3D preview of the materials.
- **Responsive Design**: Experience a fully responsive UI that adapts to different screen sizes and devices.
- **State Persistence**: Your material configurations are saved in local storage, so you can pick up where you left off.
- **Interactive UI**: Manage screen real estate efficiently with a collapsible sidebar.

## Installaion

To run Material Explorer locally, follow these steps:

1. **Clone the repository**: First, clone the repository to your local machine using Git.

git clone https://github.com/yourusername/material-explorer.git

2. **Navigate to the project directory**:

cd material-explorer

3. **Install dependencies**: Use npm to install the project's dependencies.

npm install

## Running the App

To run the app in development mode, execute:

npm start

This command starts a development server and opens the app in your default web browser. The app will reload if you make edits, and you will see any lint errors in the console.

## Building for Production

To build the app for production, run:

npm run build

This command builds the app for production to the 'build' folder. It correctly bundles React in production mode and optimizes the build for the best performance.

## Usage

**Creating a Material**
- Use the controls in the sidebar to set the material's color, metalness, and roughness.
- Click "Save Material" to add the material to your collection.

**Editing a Material**
- Click "Edit" next to any material in the sidebar to load it into the editor.
- Adjust the material's properties as desired and click "Save Material" to update it.

**Deleting a Material**
- Click "Delete" next to any material in the sidebar to remove it from your collection.

**Viewing Materials**
- The 3D preview in the center of the screen will update in real-time as you adjust the material properties.
- Collapse or expand the sidebar to toggle between a wider view of the 3D preview and the material list.

## Contributing

Contributions to Material Explorer are welcome! Please follow the standard GitHub pull request process to propose changes.

## License

Material Explorer is released under the MIT License. See the LICENSE file for more information.
