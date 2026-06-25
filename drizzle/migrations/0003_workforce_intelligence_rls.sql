-- GrowthOS Workforce Intelligence — RLS policies (Phase 12G)
-- Tenant isolation + manager team scope + HR org scope. Employees: no decision deliberation reads.

CREATE OR REPLACE FUNCTION public.manager_can_access_team(target_team_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    target_team_id IS NOT NULL
    AND public.current_user_is_manager()
    AND public.is_same_organization(
      (SELECT t.organization_id FROM teams t WHERE t.id = target_team_id)
    )
    AND EXISTS (
      SELECT 1
      FROM managers m
      WHERE m.employee_id = public.current_user_employee_id()
        AND m.team_id = target_team_id
    );
$$;

CREATE OR REPLACE FUNCTION public.user_can_read_workforce_decision(
  target_organization_id uuid,
  target_team_id uuid,
  target_owner_employee_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.is_same_organization(target_organization_id)
    AND (
      public.current_user_is_hr_admin()
      OR public.current_user_is_org_admin()
      OR (
        public.current_user_is_manager()
        AND (
          target_owner_employee_id = public.current_user_employee_id()
          OR public.manager_can_access_team(target_team_id)
        )
      )
    );
$$;

CREATE OR REPLACE FUNCTION public.user_can_write_workforce_decision(
  target_organization_id uuid,
  target_team_id uuid,
  target_owner_employee_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.is_same_organization(target_organization_id)
    AND (
      public.current_user_is_hr_admin()
      OR public.current_user_is_org_admin()
      OR (
        public.current_user_is_manager()
        AND (
          target_owner_employee_id = public.current_user_employee_id()
          OR public.manager_can_access_team(target_team_id)
        )
      )
    );
$$;

-- Enable RLS on Workforce Intelligence tables
ALTER TABLE public.business_priorities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workforce_context_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workforce_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decision_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decision_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decision_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_scenario_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_scenario_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_evolution_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_task_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_action_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_proposed_actions ENABLE ROW LEVEL SECURITY;

-- Org-scoped reference data (HR/admin write; manager read)
CREATE POLICY business_priorities_select ON public.business_priorities
  FOR SELECT USING (
    public.is_same_organization(organization_id)
    AND (
      public.current_user_is_manager()
      OR public.current_user_is_hr_admin()
      OR public.current_user_is_org_admin()
      OR public.current_user_is_executive_readonly()
    )
  );

CREATE POLICY business_priorities_manage_hr ON public.business_priorities
  FOR ALL USING (
    public.is_same_organization(organization_id)
    AND (public.current_user_is_hr_admin() OR public.current_user_is_org_admin())
  )
  WITH CHECK (
    public.is_same_organization(organization_id)
    AND (public.current_user_is_hr_admin() OR public.current_user_is_org_admin())
  );

CREATE POLICY projects_select ON public.projects
  FOR SELECT USING (
    public.is_same_organization(organization_id)
    AND (
      public.current_user_is_manager()
      OR public.current_user_is_hr_admin()
      OR public.current_user_is_org_admin()
      OR public.current_user_is_executive_readonly()
    )
  );

CREATE POLICY projects_manage_hr ON public.projects
  FOR ALL USING (
    public.is_same_organization(organization_id)
    AND (public.current_user_is_hr_admin() OR public.current_user_is_org_admin())
  )
  WITH CHECK (
    public.is_same_organization(organization_id)
    AND (public.current_user_is_hr_admin() OR public.current_user_is_org_admin())
  );

CREATE POLICY project_memberships_select ON public.project_memberships
  FOR SELECT USING (
    public.is_same_organization(organization_id)
    AND (
      public.user_can_read_employee_data(employee_id)
      OR public.current_user_is_hr_admin()
      OR public.current_user_is_org_admin()
    )
  );

CREATE POLICY project_memberships_manage_hr ON public.project_memberships
  FOR ALL USING (
    public.is_same_organization(organization_id)
    AND (public.current_user_is_hr_admin() OR public.current_user_is_org_admin())
  )
  WITH CHECK (
    public.is_same_organization(organization_id)
    AND (public.current_user_is_hr_admin() OR public.current_user_is_org_admin())
  );

-- Context graph edges — scoped reads; HR manages
CREATE POLICY workforce_context_edges_select ON public.workforce_context_edges
  FOR SELECT USING (
    public.is_same_organization(organization_id)
    AND (
      public.current_user_is_manager()
      OR public.current_user_is_hr_admin()
      OR public.current_user_is_org_admin()
      OR public.current_user_is_executive_readonly()
    )
  );

CREATE POLICY workforce_context_edges_manage_hr ON public.workforce_context_edges
  FOR ALL USING (
    public.is_same_organization(organization_id)
    AND (public.current_user_is_hr_admin() OR public.current_user_is_org_admin())
  )
  WITH CHECK (
    public.is_same_organization(organization_id)
    AND (public.current_user_is_hr_admin() OR public.current_user_is_org_admin())
  );

-- Workforce decisions
CREATE POLICY workforce_decisions_select ON public.workforce_decisions
  FOR SELECT USING (
    public.user_can_read_workforce_decision(organization_id, team_id, owner_employee_id)
  );

CREATE POLICY workforce_decisions_insert ON public.workforce_decisions
  FOR INSERT WITH CHECK (
    public.user_can_write_workforce_decision(organization_id, team_id, owner_employee_id)
  );

CREATE POLICY workforce_decisions_update ON public.workforce_decisions
  FOR UPDATE USING (
    public.user_can_write_workforce_decision(organization_id, team_id, owner_employee_id)
  )
  WITH CHECK (
    public.user_can_write_workforce_decision(organization_id, team_id, owner_employee_id)
  );

CREATE POLICY workforce_decisions_delete_hr ON public.workforce_decisions
  FOR DELETE USING (
    public.is_same_organization(organization_id)
    AND (public.current_user_is_hr_admin() OR public.current_user_is_org_admin())
  );

-- Decision children (via parent decision)
CREATE POLICY decision_evidence_select ON public.decision_evidence
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workforce_decisions d
      WHERE d.id = decision_id
        AND public.user_can_read_workforce_decision(d.organization_id, d.team_id, d.owner_employee_id)
    )
  );

CREATE POLICY decision_evidence_write ON public.decision_evidence
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM workforce_decisions d
      WHERE d.id = decision_id
        AND public.user_can_write_workforce_decision(d.organization_id, d.team_id, d.owner_employee_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workforce_decisions d
      WHERE d.id = decision_id
        AND public.user_can_write_workforce_decision(d.organization_id, d.team_id, d.owner_employee_id)
    )
  );

CREATE POLICY decision_outcomes_select ON public.decision_outcomes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workforce_decisions d
      WHERE d.id = decision_id
        AND public.user_can_read_workforce_decision(d.organization_id, d.team_id, d.owner_employee_id)
    )
  );

CREATE POLICY decision_outcomes_write ON public.decision_outcomes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM workforce_decisions d
      WHERE d.id = decision_id
        AND public.user_can_write_workforce_decision(d.organization_id, d.team_id, d.owner_employee_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workforce_decisions d
      WHERE d.id = decision_id
        AND public.user_can_write_workforce_decision(d.organization_id, d.team_id, d.owner_employee_id)
    )
  );

CREATE POLICY decision_participants_select ON public.decision_participants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workforce_decisions d
      WHERE d.id = decision_id
        AND public.user_can_read_workforce_decision(d.organization_id, d.team_id, d.owner_employee_id)
    )
  );

CREATE POLICY decision_participants_write ON public.decision_participants
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM workforce_decisions d
      WHERE d.id = decision_id
        AND public.user_can_write_workforce_decision(d.organization_id, d.team_id, d.owner_employee_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workforce_decisions d
      WHERE d.id = decision_id
        AND public.user_can_write_workforce_decision(d.organization_id, d.team_id, d.owner_employee_id)
    )
  );

-- Team scenarios — manager team scope or HR org
CREATE POLICY team_scenarios_select ON public.team_scenarios
  FOR SELECT USING (
    public.is_same_organization(organization_id)
    AND (
      public.current_user_is_hr_admin()
      OR public.current_user_is_org_admin()
      OR public.current_user_is_executive_readonly()
      OR public.manager_can_access_team(team_id)
    )
  );

CREATE POLICY team_scenarios_write ON public.team_scenarios
  FOR ALL USING (
    public.is_same_organization(organization_id)
    AND (
      public.current_user_is_hr_admin()
      OR public.current_user_is_org_admin()
      OR public.manager_can_access_team(team_id)
    )
  )
  WITH CHECK (
    public.is_same_organization(organization_id)
    AND (
      public.current_user_is_hr_admin()
      OR public.current_user_is_org_admin()
      OR public.manager_can_access_team(team_id)
    )
  );

CREATE POLICY team_scenario_roles_select ON public.team_scenario_roles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM team_scenarios ts
      WHERE ts.id = team_scenario_id
        AND public.is_same_organization(ts.organization_id)
        AND (
          public.current_user_is_hr_admin()
          OR public.current_user_is_org_admin()
          OR public.current_user_is_executive_readonly()
          OR public.manager_can_access_team(ts.team_id)
        )
    )
  );

CREATE POLICY team_scenario_roles_write ON public.team_scenario_roles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM team_scenarios ts
      WHERE ts.id = team_scenario_id
        AND public.is_same_organization(ts.organization_id)
        AND (
          public.current_user_is_hr_admin()
          OR public.current_user_is_org_admin()
          OR public.manager_can_access_team(ts.team_id)
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_scenarios ts
      WHERE ts.id = team_scenario_id
        AND public.is_same_organization(ts.organization_id)
        AND (
          public.current_user_is_hr_admin()
          OR public.current_user_is_org_admin()
          OR public.manager_can_access_team(ts.team_id)
        )
    )
  );

CREATE POLICY team_scenario_skills_select ON public.team_scenario_skills
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM team_scenarios ts
      WHERE ts.id = team_scenario_id
        AND public.is_same_organization(ts.organization_id)
        AND (
          public.current_user_is_hr_admin()
          OR public.current_user_is_org_admin()
          OR public.current_user_is_executive_readonly()
          OR public.manager_can_access_team(ts.team_id)
        )
    )
  );

CREATE POLICY team_scenario_skills_write ON public.team_scenario_skills
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM team_scenarios ts
      WHERE ts.id = team_scenario_id
        AND public.is_same_organization(ts.organization_id)
        AND (
          public.current_user_is_hr_admin()
          OR public.current_user_is_org_admin()
          OR public.manager_can_access_team(ts.team_id)
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_scenarios ts
      WHERE ts.id = team_scenario_id
        AND public.is_same_organization(ts.organization_id)
        AND (
          public.current_user_is_hr_admin()
          OR public.current_user_is_org_admin()
          OR public.manager_can_access_team(ts.team_id)
        )
    )
  );

-- Role evolution — HR/org manage; manager/executive read org
CREATE POLICY role_evolution_scenarios_select ON public.role_evolution_scenarios
  FOR SELECT USING (
    public.is_same_organization(organization_id)
    AND (
      public.current_user_is_manager()
      OR public.current_user_is_hr_admin()
      OR public.current_user_is_org_admin()
      OR public.current_user_is_executive_readonly()
    )
  );

CREATE POLICY role_evolution_scenarios_manage_hr ON public.role_evolution_scenarios
  FOR ALL USING (
    public.is_same_organization(organization_id)
    AND (public.current_user_is_hr_admin() OR public.current_user_is_org_admin())
  )
  WITH CHECK (
    public.is_same_organization(organization_id)
    AND (public.current_user_is_hr_admin() OR public.current_user_is_org_admin())
  );

CREATE POLICY role_task_changes_select ON public.role_task_changes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM role_evolution_scenarios r
      WHERE r.id = role_evolution_scenario_id
        AND public.is_same_organization(r.organization_id)
        AND (
          public.current_user_is_manager()
          OR public.current_user_is_hr_admin()
          OR public.current_user_is_org_admin()
          OR public.current_user_is_executive_readonly()
        )
    )
  );

CREATE POLICY role_task_changes_manage_hr ON public.role_task_changes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM role_evolution_scenarios r
      WHERE r.id = role_evolution_scenario_id
        AND public.is_same_organization(r.organization_id)
        AND (public.current_user_is_hr_admin() OR public.current_user_is_org_admin())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM role_evolution_scenarios r
      WHERE r.id = role_evolution_scenario_id
        AND public.is_same_organization(r.organization_id)
        AND (public.current_user_is_hr_admin() OR public.current_user_is_org_admin())
    )
  );

-- Agent action plans — employee self or manager/HR scoped
CREATE POLICY agent_action_plans_select ON public.agent_action_plans
  FOR SELECT USING (
    public.is_same_organization(organization_id)
    AND (
      public.user_can_read_employee_data(employee_id)
      OR public.current_user_is_hr_admin()
      OR public.current_user_is_org_admin()
    )
  );

CREATE POLICY agent_action_plans_write ON public.agent_action_plans
  FOR ALL USING (
    public.is_same_organization(organization_id)
    AND (
      employee_id = public.current_user_employee_id()
      OR public.current_user_is_manager()
      OR public.current_user_is_hr_admin()
      OR public.current_user_is_org_admin()
    )
  )
  WITH CHECK (
    public.is_same_organization(organization_id)
    AND (
      employee_id = public.current_user_employee_id()
      OR public.current_user_is_manager()
      OR public.current_user_is_hr_admin()
      OR public.current_user_is_org_admin()
    )
  );

CREATE POLICY agent_proposed_actions_select ON public.agent_proposed_actions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM agent_action_plans p
      WHERE p.id = action_plan_id
        AND public.is_same_organization(p.organization_id)
        AND (
          public.user_can_read_employee_data(p.employee_id)
          OR public.current_user_is_hr_admin()
          OR public.current_user_is_org_admin()
        )
    )
  );

CREATE POLICY agent_proposed_actions_write ON public.agent_proposed_actions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM agent_action_plans p
      WHERE p.id = action_plan_id
        AND public.is_same_organization(p.organization_id)
        AND (
          p.employee_id = public.current_user_employee_id()
          OR public.current_user_is_manager()
          OR public.current_user_is_hr_admin()
          OR public.current_user_is_org_admin()
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM agent_action_plans p
      WHERE p.id = action_plan_id
        AND public.is_same_organization(p.organization_id)
        AND (
          p.employee_id = public.current_user_employee_id()
          OR public.current_user_is_manager()
          OR public.current_user_is_hr_admin()
          OR public.current_user_is_org_admin()
        )
    )
  );

GRANT EXECUTE ON FUNCTION public.manager_can_access_team(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_can_read_workforce_decision(uuid, uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_can_write_workforce_decision(uuid, uuid, uuid) TO authenticated;
