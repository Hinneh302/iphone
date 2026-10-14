import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    build: {
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
          hostels: path.resolve(__dirname, 'hostels.html'),
          hostelDetails: path.resolve(__dirname, 'hostel-details.html'),
          universities: path.resolve(__dirname, 'universities.html'),
          contact: path.resolve(__dirname, 'contact.html'),
          login: path.resolve(__dirname, 'login.html'),
          register: path.resolve(__dirname, 'register.html'),
          studentDashboard: path.resolve(__dirname, 'student-dashboard.html'),
          ownerDashboard: path.resolve(__dirname, 'owner-dashboard.html'),
          adminDashboard: path.resolve(__dirname, 'admin-dashboard.html'),
        },
      },
    },
  };
});
