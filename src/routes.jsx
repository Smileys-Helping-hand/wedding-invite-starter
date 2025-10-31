import React from 'react';
import InviteEntryPage from './pages/InviteEntryPage.jsx';
import InviteExperiencePage from './pages/InviteExperiencePage.jsx';
import AdminPage from './pages/admin/AdminPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

export const ROUTE_PATHS = {
  inviteEntry: '/',
  inviteExperience: '/invite',
  admin: '/admin',
};

export const routeDefinitions = [
  {
    path: ROUTE_PATHS.inviteEntry,
    element: <InviteEntryPage />, 
    meta: {
      title: 'Enter Invite Code',
      requiresGuest: false,
    },
  },
  {
    path: ROUTE_PATHS.inviteExperience,
    element: <InviteExperiencePage />,
    meta: {
      title: 'Invitation Experience',
      requiresGuest: true,
    },
  },
  {
    path: `${ROUTE_PATHS.admin}/*`,
    element: <AdminPage />,
    meta: {
      title: 'Admin Dashboard',
      requiresGuest: false,
      restricted: true,
    },
  },
  {
    path: '*',
    element: <NotFoundPage />,
    meta: {
      title: 'Page Not Found',
      requiresGuest: false,
    },
  },
];

export const isGuestRoute = (path) => {
  const entry = routeDefinitions.find((route) => route.path === path);
  if (!entry) return false;
  return Boolean(entry.meta?.requiresGuest);
};
