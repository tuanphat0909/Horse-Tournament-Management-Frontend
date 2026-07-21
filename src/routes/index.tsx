import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { HomePage } from '../pages/HomePage';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { DashboardPage } from '../pages/DashboardPage';
import { VerifyEmailPage } from '../pages/VerifyEmailPage';
import { PaymentReturnPage } from '../pages/PaymentReturnPage';

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
import { AdminReportsPage } from '../pages/admin/AdminReportsPage';
import { AdminWalletPage } from '../pages/admin/AdminWalletPage';
import { NotificationsPage } from '../pages/NotificationsPage';

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
import { RefereeSchedulePage } from '../pages/referee/RefereeSchedulePage';

// Spectator
import { SpectatorDashboardPage } from '../pages/spectator/SpectatorDashboardPage';
import { SpectatorTournamentsPage } from '../pages/spectator/SpectatorTournamentsPage';
import { SpectatorTournamentDetailPage } from '../pages/spectator/SpectatorTournamentDetailPage';
import { SpectatorRaceDetailPage } from '../pages/spectator/SpectatorRaceDetailPage';
import { SpectatorLiveResultsPage } from '../pages/spectator/SpectatorLiveResultsPage';
import { SpectatorPredictionsPage } from '../pages/spectator/SpectatorPredictionsPage';
import { SpectatorWalletOverviewPage } from '../pages/spectator/SpectatorWalletOverviewPage';
import { SpectatorDepositPage } from '../pages/spectator/SpectatorDepositPage';
import { SpectatorWithdrawPage } from '../pages/spectator/SpectatorWithdrawPage';

// Veterinarian
import { VetDashboardPage } from '../pages/vet/VetDashboardPage';
import { MedicalCheckPage } from '../pages/vet/MedicalCheckPage';

// Public pages (no login required)
import { LeaderboardPage } from '../pages/LeaderboardPage';
import { AboutPage } from '../pages/AboutPage';
import { LegalPage } from '../pages/LegalPage';

import { PrivateRoute } from './PrivateRoute';
import { NotificationProvider } from '../context/NotificationContext';

/**
 * Chuyển trang thì luôn về đầu trang — nếu không, bấm link ở footer sẽ mở trang
 * mới ngay tại vị trí cuộn cũ (tức là ở tận cuối trang).
 * Link có anchor (vd /legal#privacy) được bỏ qua để trang tự cuộn tới đúng mục.
 */
function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) return;
    window.scrollTo({ top: 0, left: 0 });
  }, [pathname, hash]);

  return null;
}

export function AppRoutes() {
  return (
    <NotificationProvider>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/legal" element={<LegalPage />} />
        <Route path="/payment/vnpay/return" element={<PrivateRoute><PaymentReturnPage /></PrivateRoute>} />

        {/* Horse Owner (legacy route kept for backward compat) */}
        <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />

        {/* Admin */}
        <Route path="/admin/dashboard" element={<PrivateRoute allowedRoles={['Admin']}><AdminDashboardPage /></PrivateRoute>} />
        <Route path="/admin/users" element={<PrivateRoute allowedRoles={['Admin']}><AdminUsersPage /></PrivateRoute>} />
        <Route path="/admin/tournaments" element={<PrivateRoute allowedRoles={['Admin']}><AdminTournamentsPage /></PrivateRoute>} />
        <Route path="/admin/races" element={<PrivateRoute allowedRoles={['Admin']}><AdminRacesPage /></PrivateRoute>} />
        <Route path="/admin/registrations" element={<PrivateRoute allowedRoles={['Admin']}><AdminRegistrationsPage /></PrivateRoute>} />
        <Route path="/admin/referees" element={<PrivateRoute allowedRoles={['Admin']}><AdminRefereesPage /></PrivateRoute>} />
        <Route path="/admin/results" element={<PrivateRoute allowedRoles={['Admin']}><AdminResultsPage /></PrivateRoute>} />
        <Route path="/admin/predictions" element={<PrivateRoute allowedRoles={['Admin']}><AdminPredictionsPage /></PrivateRoute>} />
        <Route path="/admin/violations" element={<PrivateRoute allowedRoles={['Admin']}><AdminViolationsPage /></PrivateRoute>} />
        <Route path="/admin/reports" element={<PrivateRoute allowedRoles={['Admin']}><AdminReportsPage /></PrivateRoute>} />
        <Route path="/admin/wallet" element={<PrivateRoute allowedRoles={['Admin']}><AdminWalletPage /></PrivateRoute>} />
        <Route path="/admin/notifications" element={<PrivateRoute allowedRoles={['Admin']}><NotificationsPage /></PrivateRoute>} />

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
        <Route path="/owner/notifications" element={<PrivateRoute><NotificationsPage /></PrivateRoute>} />

        {/* Jockey */}
        <Route path="/jockey/dashboard" element={<PrivateRoute><JockeyDashboardPage /></PrivateRoute>} />
        <Route path="/jockey/invitations" element={<PrivateRoute><JockeyInvitationsPage /></PrivateRoute>} />
        <Route path="/jockey/races" element={<PrivateRoute><JockeyRacesPage /></PrivateRoute>} />
        <Route path="/jockey/schedule" element={<PrivateRoute><JockeySchedulePage /></PrivateRoute>} />
        <Route path="/jockey/stats" element={<PrivateRoute><JockeyStatsPage /></PrivateRoute>} />
        <Route path="/jockey/violations" element={<PrivateRoute><JockeyViolationsPage /></PrivateRoute>} />
        <Route path="/jockey/notifications" element={<PrivateRoute><NotificationsPage /></PrivateRoute>} />

        {/* Referee */}
        <Route path="/referee/dashboard" element={<PrivateRoute allowedRoles={['Referee']}><RefereeDashboardPage /></PrivateRoute>} />
        <Route path="/referee/horse-check" element={<PrivateRoute allowedRoles={['Referee']}><RefereeHorseCheckPage /></PrivateRoute>} />
        <Route path="/referee/violations" element={<PrivateRoute allowedRoles={['Referee']}><RefereeViolationsPage /></PrivateRoute>} />
        <Route path="/referee/confirm-results" element={<PrivateRoute allowedRoles={['Referee']}><RefereeConfirmResultsPage /></PrivateRoute>} />
        <Route path="/referee/reports" element={<PrivateRoute allowedRoles={['Referee']}><RefereeReportsPage /></PrivateRoute>} />
        <Route path="/referee/schedule" element={<PrivateRoute allowedRoles={['Referee']}><RefereeSchedulePage /></PrivateRoute>} />
        <Route path="/referee/notifications" element={<PrivateRoute allowedRoles={['Referee']}><NotificationsPage /></PrivateRoute>} />

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
        <Route path="/spectator/notifications" element={<PrivateRoute><NotificationsPage /></PrivateRoute>} />
        
        {/* Veterinarian */}
        <Route path="/vet/dashboard" element={<PrivateRoute><VetDashboardPage /></PrivateRoute>} />
        <Route path="/vet/medical-check" element={<PrivateRoute><MedicalCheckPage /></PrivateRoute>} />
        <Route path="/vet/notifications" element={<PrivateRoute><NotificationsPage /></PrivateRoute>} />

        {/* Core notifications route accessible by all roles */}
        <Route path="/notifications" element={<PrivateRoute><NotificationsPage /></PrivateRoute>} />
      </Routes>
    </NotificationProvider>
  );
}
