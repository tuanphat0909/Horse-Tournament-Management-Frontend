import { Routes, Route, Navigate } from 'react-router-dom';
import { HomePage } from '../pages/HomePage';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { DashboardPage } from '../pages/DashboardPage';
import { VerifyEmailPage } from '../pages/VerifyEmailPage';

// Admin
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage';
import { AdminUsersPage } from '../pages/admin/AdminUsersPage';
import { AdminTournamentsPage } from '../pages/admin/AdminTournamentsPage';
import { AdminRacesPage } from '../pages/admin/AdminRacesPage';
import { AdminRegistrationsPage } from '../pages/admin/AdminRegistrationsPage';
import { AdminRefereesPage } from '../pages/admin/AdminRefereesPage';
import { AdminResultsPage } from '../pages/admin/AdminResultsPage';
import { AdminPredictionsPage } from '../pages/admin/AdminPredictionsPage';
import { AdminViolationsPage } from '../pages/admin/AdminViolationsPage';

// Owner
import { OwnerDashboardPage } from '../pages/owner/OwnerDashboardPage';
import { OwnerHorsesPage } from '../pages/owner/OwnerHorsesPage';
import { OwnerJockeysPage } from '../pages/owner/OwnerJockeysPage';
import { OwnerRegistrationsPage } from '../pages/owner/OwnerRegistrationsPage';
import { OwnerResultsPage } from '../pages/owner/OwnerResultsPage';
import { OwnerTournamentsPage } from '../pages/owner/OwnerTournamentsPage';
import { OwnerWalletOverviewPage } from '../pages/owner/OwnerWalletOverviewPage';
import { OwnerDepositPage } from '../pages/owner/OwnerDepositPage';
import { OwnerWithdrawPage } from '../pages/owner/OwnerWithdrawPage';

// Jockey
import { JockeyDashboardPage } from '../pages/jockey/JockeyDashboardPage';
import { JockeyInvitationsPage } from '../pages/jockey/JockeyInvitationsPage';
import { JockeyRacesPage } from '../pages/jockey/JockeyRacesPage';
import { JockeySchedulePage } from '../pages/jockey/JockeySchedulePage';
import { JockeyStatsPage } from '../pages/jockey/JockeyStatsPage';
import { JockeyViolationsPage } from '../pages/jockey/JockeyViolationsPage';

// Referee
import { RefereeDashboardPage } from '../pages/referee/RefereeDashboardPage';
import { RefereeHorseCheckPage } from '../pages/referee/RefereeHorseCheckPage';
import { RefereeViolationsPage } from '../pages/referee/RefereeViolationsPage';
import { RefereeConfirmResultsPage } from '../pages/referee/RefereeConfirmResultsPage';
import { RefereeReportsPage } from '../pages/referee/RefereeReportsPage';

// Spectator
import { SpectatorDashboardPage } from '../pages/spectator/SpectatorDashboardPage';
import { SpectatorTournamentsPage } from '../pages/spectator/SpectatorTournamentsPage';
import { SpectatorTournamentDetailPage } from '../pages/spectator/SpectatorTournamentDetailPage';
import { SpectatorRaceDetailPage } from '../pages/spectator/SpectatorRaceDetailPage';
import { SpectatorLiveResultsPage } from '../pages/spectator/SpectatorLiveResultsPage';
import { SpectatorPredictionsPage } from '../pages/spectator/SpectatorPredictionsPage';
import { SpectatorNotificationsPage } from '../pages/spectator/SpectatorNotificationsPage';
import { SpectatorWalletOverviewPage } from '../pages/spectator/SpectatorWalletOverviewPage';
import { SpectatorDepositPage } from '../pages/spectator/SpectatorDepositPage';
import { SpectatorWithdrawPage } from '../pages/spectator/SpectatorWithdrawPage';

// Veterinarian
import { VetDashboardPage } from '../pages/vet/VetDashboardPage';
import { MedicalCheckPage } from '../pages/vet/MedicalCheckPage';

import { PrivateRoute } from './PrivateRoute';
import { NotificationProvider } from '../context/NotificationContext';

export function AppRoutes() {
  return (
    <NotificationProvider>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />

        {/* Horse Owner (legacy route kept for backward compat) */}
        <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />

        {/* Admin */}
        <Route path="/admin/dashboard" element={<PrivateRoute><AdminDashboardPage /></PrivateRoute>} />
        <Route path="/admin/users" element={<PrivateRoute><AdminUsersPage /></PrivateRoute>} />
        <Route path="/admin/tournaments" element={<PrivateRoute><AdminTournamentsPage /></PrivateRoute>} />
        <Route path="/admin/races" element={<PrivateRoute><AdminRacesPage /></PrivateRoute>} />
        <Route path="/admin/registrations" element={<PrivateRoute><AdminRegistrationsPage /></PrivateRoute>} />
        <Route path="/admin/referees" element={<PrivateRoute><AdminRefereesPage /></PrivateRoute>} />
        <Route path="/admin/results" element={<PrivateRoute><AdminResultsPage /></PrivateRoute>} />
        <Route path="/admin/predictions" element={<PrivateRoute><AdminPredictionsPage /></PrivateRoute>} />
        <Route path="/admin/violations" element={<PrivateRoute><AdminViolationsPage /></PrivateRoute>} />

        {/* Owner — wallet sub-routes (/owner/wallet → redirect to /withdraw) */}
        <Route path="/owner/dashboard" element={<PrivateRoute><OwnerDashboardPage /></PrivateRoute>} />
        <Route path="/owner/wallet" element={<Navigate to="/owner/wallet/withdraw" replace />} />
        <Route path="/owner/wallet/overview" element={<PrivateRoute><OwnerWalletOverviewPage /></PrivateRoute>} />
        <Route path="/owner/wallet/deposit" element={<PrivateRoute><OwnerDepositPage /></PrivateRoute>} />
        <Route path="/owner/wallet/withdraw" element={<PrivateRoute><OwnerWithdrawPage /></PrivateRoute>} />
        <Route path="/owner/horses" element={<PrivateRoute><OwnerHorsesPage /></PrivateRoute>} />
        <Route path="/owner/jockeys" element={<PrivateRoute><OwnerJockeysPage /></PrivateRoute>} />
        <Route path="/owner/registrations" element={<PrivateRoute><OwnerRegistrationsPage /></PrivateRoute>} />
        <Route path="/owner/results" element={<PrivateRoute><OwnerResultsPage /></PrivateRoute>} />
        <Route path="/owner/tournaments" element={<PrivateRoute><OwnerTournamentsPage /></PrivateRoute>} />

        {/* Jockey */}
        <Route path="/jockey/dashboard" element={<PrivateRoute><JockeyDashboardPage /></PrivateRoute>} />
        <Route path="/jockey/invitations" element={<PrivateRoute><JockeyInvitationsPage /></PrivateRoute>} />
        <Route path="/jockey/races" element={<PrivateRoute><JockeyRacesPage /></PrivateRoute>} />
        <Route path="/jockey/schedule" element={<PrivateRoute><JockeySchedulePage /></PrivateRoute>} />
        <Route path="/jockey/stats" element={<PrivateRoute><JockeyStatsPage /></PrivateRoute>} />
        <Route path="/jockey/violations" element={<PrivateRoute><JockeyViolationsPage /></PrivateRoute>} />

        {/* Referee */}
        <Route path="/referee/dashboard" element={<PrivateRoute><RefereeDashboardPage /></PrivateRoute>} />
        <Route path="/referee/horse-check" element={<PrivateRoute><RefereeHorseCheckPage /></PrivateRoute>} />
        <Route path="/referee/violations" element={<PrivateRoute><RefereeViolationsPage /></PrivateRoute>} />
        <Route path="/referee/confirm-results" element={<PrivateRoute><RefereeConfirmResultsPage /></PrivateRoute>} />
        <Route path="/referee/reports" element={<PrivateRoute><RefereeReportsPage /></PrivateRoute>} />

        {/* Spectator — wallet sub-routes (/spectator/wallet → redirect to /withdraw) */}
        <Route path="/spectator/dashboard" element={<PrivateRoute><SpectatorDashboardPage /></PrivateRoute>} />
        <Route path="/spectator/wallet" element={<Navigate to="/spectator/wallet/withdraw" replace />} />
        <Route path="/spectator/wallet/overview" element={<PrivateRoute><SpectatorWalletOverviewPage /></PrivateRoute>} />
        <Route path="/spectator/wallet/deposit" element={<PrivateRoute><SpectatorDepositPage /></PrivateRoute>} />
        <Route path="/spectator/wallet/withdraw" element={<PrivateRoute><SpectatorWithdrawPage /></PrivateRoute>} />
        <Route path="/spectator/tournaments" element={<PrivateRoute><SpectatorTournamentsPage /></PrivateRoute>} />
        <Route path="/spectator/tournaments/:tournamentId" element={<PrivateRoute><SpectatorTournamentDetailPage /></PrivateRoute>} />
        <Route path="/spectator/races/:raceId" element={<PrivateRoute><SpectatorRaceDetailPage /></PrivateRoute>} />
        <Route path="/spectator/live" element={<PrivateRoute><SpectatorLiveResultsPage /></PrivateRoute>} />
        <Route path="/spectator/predictions" element={<PrivateRoute><SpectatorPredictionsPage /></PrivateRoute>} />
        <Route path="/spectator/notifications" element={<PrivateRoute><SpectatorNotificationsPage /></PrivateRoute>} />
        
        {/* Veterinarian */}
        <Route path="/vet/dashboard" element={<PrivateRoute><VetDashboardPage /></PrivateRoute>} />
        <Route path="/vet/medical-check" element={<PrivateRoute><MedicalCheckPage /></PrivateRoute>} />

        {/* Core notifications route accessible by all roles */}
        <Route path="/notifications" element={<PrivateRoute><SpectatorNotificationsPage /></PrivateRoute>} />
      </Routes>
    </NotificationProvider>
  );
}
