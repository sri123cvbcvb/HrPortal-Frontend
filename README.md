# HrPortal Frontend

A modern, responsive Human Resource Management System (HRMS) frontend built with React and Material-UI.

## Technology Stack

- **Framework**: React 19
- **Build Tool**: Vite 7
- **UI Library**: Material-UI (MUI) 7
- **Routing**: React Router DOM 7
- **HTTP Client**: Axios
- **WebSocket**: STOMP.js + SockJS
- **PDF Generation**: jsPDF + jsPDF-AutoTable
- **Notifications**: React Toastify
- **Date Utilities**: date-fns

## Features

- **Authentication**: Login and signup with JWT token management
- **Role-Based Dashboards**: Separate admin and employee interfaces
- **Employee Management** (Admin): Full CRUD for employee profiles with statutory and payroll details
- **Attendance**: Geolocation-based check-in/check-out with monthly attendance calendar
- **Leave Management**: Apply for leaves, view balances, admin approval workflow, company holidays
- **Payroll**: View payslips with detailed salary breakdown and PDF download
- **Real-Time Notifications**: WebSocket-based attendance reminders

## Prerequisites

- Node.js 18+
- npm 9+
- Backend API running (see [HrPortal-Backend](https://github.com/sri123cvbcvb/HrPortal-Backend))

## Environment Setup

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` if needed:
   ```
   VITE_API_URL=/api/
   ```

   In development, the Vite dev server proxies `/api/` requests to `http://localhost:8080`.
   In production, set `VITE_API_URL` to your actual backend URL.

## How to Run

```bash
# Install dependencies
npm install

# Start development server (runs on http://localhost:3000)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Backend API Configuration

The frontend communicates with the backend via REST API. In development mode, the Vite dev server proxies:

- `/api/*` requests to `http://localhost:8080`
- `/ws-hrms` WebSocket connections to `http://localhost:8080`

This is configured in `vite.config.js`.

## Project Structure

```
src/
+-- main.jsx                    # Application entry point
+-- App.jsx                     # Root component with routing
+-- App.css                     # Global application styles
+-- index.css                   # Base CSS reset/styles
+-- assets/                     # Static assets
+-- components/
|   +-- Layout.jsx              # App layout with header/navigation
|   +-- PrivateRoute.jsx        # Protected route with role-based access
|   +-- NotificationListener.jsx # WebSocket notification handler
+-- context/
|   +-- AuthContext.jsx          # Authentication state management
+-- pages/
|   +-- Login.jsx                # Login page
|   +-- Signup.jsx               # Employee registration page
|   +-- AdminDashboard.jsx       # Admin dashboard shell
|   +-- EmployeeDashboard.jsx    # Employee dashboard shell
|   +-- admin/
|   |   +-- AdminOverview.jsx    # Admin overview/stats
|   |   +-- EmployeesList.jsx    # Employee management (CRUD)
|   |   +-- AdminLeaveRequests.jsx # Leave request approvals
|   |   +-- LeaveManagement.jsx  # Leave types and balances admin
|   +-- employee/
|       +-- EmployeeHome.jsx     # Employee home/overview
|       +-- EmployeeAttendance.jsx # Attendance check-in/out
|       +-- EmployeeLeaves.jsx   # Leave application and history
|       +-- EmployeeHolidays.jsx # Company holidays calendar
|       +-- EmployeePayslips.jsx # Payslip viewer with PDF download
+-- utils/
|   +-- api.js                   # Axios instance with JWT interceptor
|   +-- theme.jsx                # Material-UI theme configuration
```

## Git Branching Strategy

This project follows **Git Flow**:

- `main` - Production-ready releases
- `develop` - Integration branch for features
- `feature/*` - Individual feature branches

Feature branches are created from and merged into `develop`.

## License

This project is proprietary software.
