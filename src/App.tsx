import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import AppLayout from './components/layout/AppLayout'
import ProtectedRoute from './components/ProtectedRoute'
import Landing from './pages/Landing'
import Login from './pages/auth/Login'
import Signup from './pages/auth/Signup'
import ForgotPassword from './pages/auth/ForgotPassword'
import Dashboard from './pages/Dashboard'
import ResumeAndJD from './pages/ResumeAndJD'
import InterviewSetup from './pages/InterviewSetup'
import InterviewRoom from './pages/InterviewRoom'
import CodingInterview from './pages/CodingInterview'
import AptitudePractice from './pages/AptitudePractice'
import RecruiterReport from './pages/RecruiterReport'
import LearningRoadmap from './pages/LearningRoadmap'
import PerformanceHistory from './pages/PerformanceHistory'
import Profile from './pages/Profile'
import SkillGapAnalysis from './pages/SkillGapAnalysis'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Protected app routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              {/* Merged Resume + JD page */}
              <Route path="/resume-jd" element={<ResumeAndJD />} />
              {/* Keep old URLs working — redirect to merged page */}
              <Route path="/resume" element={<Navigate to="/resume-jd" replace />} />
              <Route path="/job-description" element={<Navigate to="/resume-jd" replace />} />
              <Route path="/interview-setup" element={<InterviewSetup />} />
              <Route path="/interview-room" element={<InterviewRoom />} />
              <Route path="/coding-interview" element={<CodingInterview />} />
              <Route path="/aptitude" element={<AptitudePractice />} />
              <Route path="/report" element={<RecruiterReport />} />
              <Route path="/report/:sessionId" element={<RecruiterReport />} />
              <Route path="/roadmap" element={<LearningRoadmap />} />
              <Route path="/history" element={<PerformanceHistory />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/skill-gap" element={<SkillGapAnalysis />} />
            </Route>
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}
