import type { DemoRole } from './types';

export interface NavItem {
  label: string;
  href: string;
  description?: string;
}

const employeeNav: NavItem[] = [
  { label: 'Home', href: '/employee/home' },
  { label: 'Growth Profile', href: '/employee/growth-profile' },
  { label: 'Career Paths', href: '/employee/career-paths' },
  { label: 'Growth Plan', href: '/employee/growth-plan' },
  { label: '1:1 Prep', href: '/employee/manager-conversation' },
];

const managerNav: NavItem[] = [
  { label: 'Manager Home', href: '/manager/home' },
  { label: 'Team Skills', href: '/manager/team-skills' },
  { label: 'Coaching', href: '/manager/coaching' },
  { label: 'Team Capability Plan', href: '/manager/team-capability-plan' },
  { label: 'Decisions', href: '/manager/decisions' },
  { label: 'Team Scenarios', href: '/manager/team-scenarios' },
];

const hrNav: NavItem[] = [
  { label: 'HR Home', href: '/hr/home' },
  { label: 'Skills Readiness', href: '/hr/skills-readiness' },
  { label: 'Mobility Insights', href: '/hr/mobility-insights' },
  { label: 'Talent Density', href: '/hr/talent-density' },
  { label: 'Workforce Readiness', href: '/hr/workforce-readiness' },
  { label: 'Decisions', href: '/hr/decisions' },
  { label: 'Work Design', href: '/hr/work-design' },
  { label: 'Organizational Learning', href: '/hr/organizational-learning' },
  { label: 'Audit Log', href: '/hr/audit' },
];

const sharedFooter: NavItem[] = [{ label: 'Settings', href: '/settings' }];

export function getNavForRole(role: DemoRole): NavItem[] {
  switch (role) {
    case 'employee':
      return [...employeeNav, ...sharedFooter];
    case 'manager':
      return [...employeeNav, ...managerNav, ...sharedFooter];
    case 'hr':
      return [...hrNav, ...sharedFooter];
    default:
      return [...employeeNav, ...sharedFooter];
  }
}

export function getRoleAreaLabel(role: DemoRole): string {
  switch (role) {
    case 'employee':
      return 'Employee';
    case 'manager':
      return 'Manager';
    case 'hr':
      return 'HR';
    default:
      return 'GrowthOS';
  }
}
