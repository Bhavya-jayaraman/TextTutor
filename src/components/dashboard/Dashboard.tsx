/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { User } from '../../types/auth.js';
import { DashboardLayout } from './DashboardLayout.js';

interface DashboardProps {
  user: User;
  onOpenProfile: () => void;
  onLogout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onOpenProfile, onLogout }) => {
  return (
    <DashboardLayout
      user={user}
      onUpdateUser={() => {}}
      onLogout={onLogout}
    />
  );
};
