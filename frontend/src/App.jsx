import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Index from './pages/Index';
import SignUp from './pages/SignUp';
import Dashboard from './pages/Dashboard';
import Setup from './pages/Setup';
import SetupCLI from './pages/SetupCLI';
import SetupVSCode from './pages/SetupVSCode';
import SetupGitHub from './pages/SetupGitHub';
import Audit from './pages/Audit';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/signin" element={<Index />} />
        <Route path="/signup" element={<SignUp />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/setup/:appId"
          element={
            <ProtectedRoute>
              <Setup />
            </ProtectedRoute>
          }
        />
        <Route
          path="/setup/:appId/cli"
          element={
            <ProtectedRoute>
              <SetupCLI />
            </ProtectedRoute>
          }
        />
        <Route
          path="/setup/:appId/vscode"
          element={
            <ProtectedRoute>
              <SetupVSCode />
            </ProtectedRoute>
          }
        />
        <Route
          path="/setup/:appId/github"
          element={
            <ProtectedRoute>
              <SetupGitHub />
            </ProtectedRoute>
          }
        />
        <Route
          path="/audit/:appId"
          element={
            <ProtectedRoute>
              <Audit />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;

