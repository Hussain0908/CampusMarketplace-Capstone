# Campus Marketplace

A modern web application built with Next.js for campus-based buying and selling.

## Environment Configuration

This project requires the following environment setup:

- Node.js (Latest LTS version recommended)
- npm (Node Package Manager)
- TypeScript
- Next.js
- Supabase (for backend services)

## Required Packages and Dependencies

### Core Dependencies
- `next`: Latest version
- `react`: 19.0.0
- `react-dom`: 19.0.0
- `@supabase/supabase-js`: Latest version
- `@supabase/ssr`: Latest version

### UI Components and Styling
- `@radix-ui/*`: Various UI components
- `tailwindcss`: 3.4.17
- `tailwindcss-animate`: ^1.0.7
- `framer-motion`: ^12.6.5
- `lucide-react`: ^0.468.0
- `class-variance-authority`: ^0.7.0
- `clsx`: ^2.1.1

### Form Handling and Validation
- `react-hook-form`: ^7.53.0
- `@hookform/resolvers`: ^3.9.0
- `zod`: ^3.24.1

### Development Dependencies
- `typescript`: 5.7.2
- `@types/node`: 22.10.2
- `@types/react`: ^19.0.2
- `@types/react-dom`: 19.0.2
- `prettier`: ^3.3.3
- `postcss`: 8.4.49
- `autoprefixer`: 10.4.20

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your environment variables:
   - Create a `.env.local` file in the root directory
   - Add your Supabase credentials and other necessary environment variables

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Build for production:
   ```bash
   npm run build
   ```

6. Start production server:
   ```bash
   npm run start
   ```

## Project Structure
- `/app`: Next.js app directory
- `/components`: Reusable UI components
- `/contexts`: React context providers
- `/hooks`: Custom React hooks
- `/lib`: Utility functions and configurations
- `/public`: Static assets
- `/utils`: Helper functions
- `/providers`: Service providers and configurations

## License
This project is licensed under the terms specified in the LICENSE file.


