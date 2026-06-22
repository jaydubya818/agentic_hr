-- GrowthOS Phase 8B: Row Level Security and RBAC
-- Source: docs/SECURITY_AND_PRIVACY.md, docs/BACKEND_STRUCTURE.md Section 6
-- Maps auth.uid() -> users.auth_user_id for Supabase Auth integration.
-- Apply with: npm run db:migrate (requires DATABASE_URL against live Postgres/Supabase)
-- Not applied automatically in mock mode.

-- ---------------------------------------------------------------------------
-- Helper functions (SECURITY DEFINER, search_path hardened)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.current_app_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.id
  FROM users u
  WHERE u.auth_user_id = auth.uid()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_user_organization_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.organization_id
  FROM users u
  WHERE u.auth_user_id = auth.uid()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_user_employee_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT e.id
  FROM employees e
  JOIN users u ON u.id = e.user_id
  WHERE u.auth_user_id = auth.uid()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_user_has_role(role_name public.user_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN users u ON u.id = ur.user_id
    WHERE u.auth_user_id = auth.uid()
      AND ur.role = role_name
      AND ur.organization_id = public.current_user_organization_id()
  );
$$;

CREATE OR REPLACE FUNCTION public.current_user_is_org_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.current_user_has_role('org_admin'::public.user_role);
$$;

CREATE OR REPLACE FUNCTION public.current_user_is_hr_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.current_user_has_role('hr_admin'::public.user_role);
$$;

CREATE OR REPLACE FUNCTION public.current_user_is_manager()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.current_user_has_role('manager'::public.user_role);
$$;

CREATE OR REPLACE FUNCTION public.current_user_is_employee()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.current_user_has_role('employee'::public.user_role);
$$;

CREATE OR REPLACE FUNCTION public.current_user_is_executive_readonly()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.current_user_has_role('executive_readonly'::public.user_role);
$$;

CREATE OR REPLACE FUNCTION public.is_same_organization(org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT org_id IS NOT NULL
    AND org_id = public.current_user_organization_id();
$$;

-- Direct-report scope: employees.manager_id is canonical (BACKEND_STRUCTURE.md §3.6)
CREATE OR REPLACE FUNCTION public.manager_can_read_employee(target_employee_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.current_user_is_manager()
    AND public.is_same_organization(
      (SELECT e.organization_id FROM employees e WHERE e.id = target_employee_id)
    )
    AND (
      target_employee_id = public.current_user_employee_id()
      OR EXISTS (
        SELECT 1
        FROM employees target
        WHERE target.id = target_employee_id
          AND target.manager_id = public.current_user_employee_id()
      )
      OR EXISTS (
        SELECT 1
        FROM employees target
        JOIN managers m ON m.employee_id = public.current_user_employee_id()
        WHERE target.id = target_employee_id
          AND target.team_id IS NOT NULL
          AND target.team_id = m.team_id
      )
    );
$$;

CREATE OR REPLACE FUNCTION public.user_can_read_employee_data(target_employee_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.is_same_organization(
      (SELECT e.organization_id FROM employees e WHERE e.id = target_employee_id)
    )
    AND (
      target_employee_id = public.current_user_employee_id()
      OR public.manager_can_read_employee(target_employee_id)
      OR public.current_user_is_hr_admin()
      OR public.current_user_is_org_admin()
    );
$$;

CREATE OR REPLACE FUNCTION public.user_can_read_org_user(target_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    target_user_id = public.current_app_user_id()
    OR (
      public.is_same_organization(
        (SELECT u.organization_id FROM users u WHERE u.id = target_user_id)
      )
      AND (public.current_user_is_hr_admin() OR public.current_user_is_org_admin())
    );
$$;

CREATE OR REPLACE FUNCTION public.user_can_read_agent_conversation(conversation_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    conversation_user_id = public.current_app_user_id()
    OR (
      public.current_user_is_manager()
      AND EXISTS (
        SELECT 1
        FROM employees e
        WHERE e.user_id = conversation_user_id
          AND public.manager_can_read_employee(e.id)
      )
    )
    OR public.current_user_is_hr_admin()
    OR public.current_user_is_org_admin();
$$;

-- ---------------------------------------------------------------------------
-- Enable RLS on all tables
-- ---------------------------------------------------------------------------

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.managers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.growth_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.growth_plan_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendation_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_readiness_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- organizations
-- ---------------------------------------------------------------------------

CREATE POLICY organizations_select_member ON public.organizations
  FOR SELECT
  USING (id = public.current_user_organization_id());

CREATE POLICY organizations_update_org_admin ON public.organizations
  FOR UPDATE
  USING (
    id = public.current_user_organization_id()
    AND public.current_user_is_org_admin()
  )
  WITH CHECK (
    id = public.current_user_organization_id()
    AND public.current_user_is_org_admin()
  );

-- ---------------------------------------------------------------------------
-- users
-- ---------------------------------------------------------------------------

CREATE POLICY users_select_self ON public.users
  FOR SELECT
  USING (id = public.current_app_user_id());

CREATE POLICY users_select_org_admin ON public.users
  FOR SELECT
  USING (
    public.is_same_organization(organization_id)
    AND (public.current_user_is_hr_admin() OR public.current_user_is_org_admin())
  );

CREATE POLICY users_update_self ON public.users
  FOR UPDATE
  USING (id = public.current_app_user_id())
  WITH CHECK (
    id = public.current_app_user_id()
    AND organization_id = public.current_user_organization_id()
  );

CREATE POLICY users_insert_org_admin ON public.users
  FOR INSERT
  WITH CHECK (
    public.is_same_organization(organization_id)
    AND public.current_user_is_org_admin()
  );

CREATE POLICY users_update_org_admin ON public.users
  FOR UPDATE
  USING (
    public.is_same_organization(organization_id)
    AND public.current_user_is_org_admin()
  )
  WITH CHECK (
    public.is_same_organization(organization_id)
    AND public.current_user_is_org_admin()
  );

CREATE POLICY users_delete_org_admin ON public.users
  FOR DELETE
  USING (
    public.is_same_organization(organization_id)
    AND public.current_user_is_org_admin()
  );

-- ---------------------------------------------------------------------------
-- employees (executive_readonly: no SELECT policy — aggregate tables only)
-- ---------------------------------------------------------------------------

CREATE POLICY employees_select_scoped ON public.employees
  FOR SELECT
  USING (
    public.is_same_organization(organization_id)
    AND public.user_can_read_employee_data(id)
  );

CREATE POLICY employees_update_self ON public.employees
  FOR UPDATE
  USING (
    public.is_same_organization(organization_id)
    AND user_id = public.current_app_user_id()
  )
  WITH CHECK (
    public.is_same_organization(organization_id)
    AND user_id = public.current_app_user_id()
  );

CREATE POLICY employees_insert_org_admin ON public.employees
  FOR INSERT
  WITH CHECK (
    public.is_same_organization(organization_id)
    AND public.current_user_is_org_admin()
  );

CREATE POLICY employees_update_org_admin ON public.employees
  FOR UPDATE
  USING (
    public.is_same_organization(organization_id)
    AND public.current_user_is_org_admin()
  )
  WITH CHECK (
    public.is_same_organization(organization_id)
    AND public.current_user_is_org_admin()
  );

CREATE POLICY employees_delete_org_admin ON public.employees
  FOR DELETE
  USING (
    public.is_same_organization(organization_id)
    AND public.current_user_is_org_admin()
  );

-- ---------------------------------------------------------------------------
-- employee_profiles
-- ---------------------------------------------------------------------------

CREATE POLICY employee_profiles_select_scoped ON public.employee_profiles
  FOR SELECT
  USING (
    public.is_same_organization(organization_id)
    AND public.user_can_read_employee_data(employee_id)
  );

CREATE POLICY employee_profiles_update_self ON public.employee_profiles
  FOR UPDATE
  USING (
    public.is_same_organization(organization_id)
    AND employee_id = public.current_user_employee_id()
  )
  WITH CHECK (
    public.is_same_organization(organization_id)
    AND employee_id = public.current_user_employee_id()
  );

CREATE POLICY employee_profiles_insert_self ON public.employee_profiles
  FOR INSERT
  WITH CHECK (
    public.is_same_organization(organization_id)
    AND employee_id = public.current_user_employee_id()
  );

CREATE POLICY employee_profiles_manage_org_admin ON public.employee_profiles
  FOR ALL
  USING (
    public.is_same_organization(organization_id)
    AND public.current_user_is_org_admin()
  )
  WITH CHECK (
    public.is_same_organization(organization_id)
    AND public.current_user_is_org_admin()
  );

-- ---------------------------------------------------------------------------
-- teams
-- ---------------------------------------------------------------------------

CREATE POLICY teams_select_org_member ON public.teams
  FOR SELECT
  USING (
    public.is_same_organization(organization_id)
    AND (
      public.current_user_is_employee()
      OR public.current_user_is_manager()
      OR public.current_user_is_hr_admin()
      OR public.current_user_is_org_admin()
    )
  );

CREATE POLICY teams_manage_org_admin ON public.teams
  FOR ALL
  USING (
    public.is_same_organization(organization_id)
    AND public.current_user_is_org_admin()
  )
  WITH CHECK (
    public.is_same_organization(organization_id)
    AND public.current_user_is_org_admin()
  );

-- ---------------------------------------------------------------------------
-- managers
-- ---------------------------------------------------------------------------

CREATE POLICY managers_select_org_member ON public.managers
  FOR SELECT
  USING (
    public.is_same_organization(organization_id)
    AND (
      employee_id = public.current_user_employee_id()
      OR public.current_user_is_hr_admin()
      OR public.current_user_is_org_admin()
      OR public.current_user_is_manager()
    )
  );

CREATE POLICY managers_manage_org_admin ON public.managers
  FOR ALL
  USING (
    public.is_same_organization(organization_id)
    AND public.current_user_is_org_admin()
  )
  WITH CHECK (
    public.is_same_organization(organization_id)
    AND public.current_user_is_org_admin()
  );

-- ---------------------------------------------------------------------------
-- skills, roles, role_skills, learning_resources, opportunities (org catalog)
-- ---------------------------------------------------------------------------

CREATE POLICY skills_select_org_member ON public.skills
  FOR SELECT
  USING (
    public.is_same_organization(organization_id)
    AND is_active = true
    AND (
      public.current_user_is_employee()
      OR public.current_user_is_manager()
      OR public.current_user_is_hr_admin()
      OR public.current_user_is_org_admin()
    )
  );

CREATE POLICY skills_select_hr_catalog ON public.skills
  FOR SELECT
  USING (
    public.is_same_organization(organization_id)
    AND (public.current_user_is_hr_admin() OR public.current_user_is_org_admin())
  );

CREATE POLICY skills_select_executive ON public.skills
  FOR SELECT
  USING (
    public.is_same_organization(organization_id)
    AND is_active = true
    AND public.current_user_is_executive_readonly()
  );

CREATE POLICY skills_manage_hr ON public.skills
  FOR ALL
  USING (
    public.is_same_organization(organization_id)
    AND (public.current_user_is_hr_admin() OR public.current_user_is_org_admin())
  )
  WITH CHECK (
    public.is_same_organization(organization_id)
    AND (public.current_user_is_hr_admin() OR public.current_user_is_org_admin())
  );

CREATE POLICY roles_select_org_member ON public.roles
  FOR SELECT
  USING (
    public.is_same_organization(organization_id)
    AND is_active = true
    AND (
      public.current_user_is_employee()
      OR public.current_user_is_manager()
      OR public.current_user_is_hr_admin()
      OR public.current_user_is_org_admin()
    )
  );

CREATE POLICY roles_select_hr_inactive ON public.roles
  FOR SELECT
  USING (
    public.is_same_organization(organization_id)
    AND (public.current_user_is_hr_admin() OR public.current_user_is_org_admin())
  );

CREATE POLICY roles_select_executive ON public.roles
  FOR SELECT
  USING (
    public.is_same_organization(organization_id)
    AND is_active = true
    AND public.current_user_is_executive_readonly()
  );

CREATE POLICY roles_manage_hr ON public.roles
  FOR ALL
  USING (
    public.is_same_organization(organization_id)
    AND (public.current_user_is_hr_admin() OR public.current_user_is_org_admin())
  )
  WITH CHECK (
    public.is_same_organization(organization_id)
    AND (public.current_user_is_hr_admin() OR public.current_user_is_org_admin())
  );

CREATE POLICY role_skills_select_org_member ON public.role_skills
  FOR SELECT
  USING (
    public.is_same_organization(organization_id)
    AND (
      public.current_user_is_employee()
      OR public.current_user_is_manager()
      OR public.current_user_is_hr_admin()
      OR public.current_user_is_org_admin()
    )
  );

CREATE POLICY role_skills_manage_hr ON public.role_skills
  FOR ALL
  USING (
    public.is_same_organization(organization_id)
    AND (public.current_user_is_hr_admin() OR public.current_user_is_org_admin())
  )
  WITH CHECK (
    public.is_same_organization(organization_id)
    AND (public.current_user_is_hr_admin() OR public.current_user_is_org_admin())
  );

CREATE POLICY learning_resources_select_org_member ON public.learning_resources
  FOR SELECT
  USING (
    public.is_same_organization(organization_id)
    AND is_active = true
    AND (
      public.current_user_is_employee()
      OR public.current_user_is_manager()
      OR public.current_user_is_hr_admin()
      OR public.current_user_is_org_admin()
    )
  );

CREATE POLICY learning_resources_select_executive ON public.learning_resources
  FOR SELECT
  USING (
    public.is_same_organization(organization_id)
    AND is_active = true
    AND public.current_user_is_executive_readonly()
  );

CREATE POLICY learning_resources_manage_hr ON public.learning_resources
  FOR ALL
  USING (
    public.is_same_organization(organization_id)
    AND (public.current_user_is_hr_admin() OR public.current_user_is_org_admin())
  )
  WITH CHECK (
    public.is_same_organization(organization_id)
    AND (public.current_user_is_hr_admin() OR public.current_user_is_org_admin())
  );

CREATE POLICY opportunities_select_org_member ON public.opportunities
  FOR SELECT
  USING (
    public.is_same_organization(organization_id)
    AND status = 'open'::public.opportunity_status
    AND (
      public.current_user_is_employee()
      OR public.current_user_is_manager()
      OR public.current_user_is_hr_admin()
      OR public.current_user_is_org_admin()
    )
  );

CREATE POLICY opportunities_select_executive ON public.opportunities
  FOR SELECT
  USING (
    public.is_same_organization(organization_id)
    AND status = 'open'::public.opportunity_status
    AND public.current_user_is_executive_readonly()
  );

CREATE POLICY opportunities_select_hr_all_status ON public.opportunities
  FOR SELECT
  USING (
    public.is_same_organization(organization_id)
    AND (public.current_user_is_hr_admin() OR public.current_user_is_org_admin())
  );

CREATE POLICY opportunities_manage_hr ON public.opportunities
  FOR ALL
  USING (
    public.is_same_organization(organization_id)
    AND (public.current_user_is_hr_admin() OR public.current_user_is_org_admin())
  )
  WITH CHECK (
    public.is_same_organization(organization_id)
    AND (public.current_user_is_hr_admin() OR public.current_user_is_org_admin())
  );

-- ---------------------------------------------------------------------------
-- employee_skills
-- ---------------------------------------------------------------------------

CREATE POLICY employee_skills_select_scoped ON public.employee_skills
  FOR SELECT
  USING (
    public.is_same_organization(organization_id)
    AND public.user_can_read_employee_data(employee_id)
  );

CREATE POLICY employee_skills_update_self ON public.employee_skills
  FOR UPDATE
  USING (
    public.is_same_organization(organization_id)
    AND employee_id = public.current_user_employee_id()
  )
  WITH CHECK (
    public.is_same_organization(organization_id)
    AND employee_id = public.current_user_employee_id()
  );

CREATE POLICY employee_skills_insert_self ON public.employee_skills
  FOR INSERT
  WITH CHECK (
    public.is_same_organization(organization_id)
    AND employee_id = public.current_user_employee_id()
  );

CREATE POLICY employee_skills_manage_hr ON public.employee_skills
  FOR ALL
  USING (
    public.is_same_organization(organization_id)
    AND (public.current_user_is_hr_admin() OR public.current_user_is_org_admin())
  )
  WITH CHECK (
    public.is_same_organization(organization_id)
    AND (public.current_user_is_hr_admin() OR public.current_user_is_org_admin())
  );

-- ---------------------------------------------------------------------------
-- career_goals, growth_plans, growth_plan_items
-- ---------------------------------------------------------------------------

CREATE POLICY career_goals_select_scoped ON public.career_goals
  FOR SELECT
  USING (
    public.is_same_organization(organization_id)
    AND public.user_can_read_employee_data(employee_id)
  );

CREATE POLICY career_goals_write_self ON public.career_goals
  FOR INSERT
  WITH CHECK (
    public.is_same_organization(organization_id)
    AND employee_id = public.current_user_employee_id()
  );

CREATE POLICY career_goals_update_self ON public.career_goals
  FOR UPDATE
  USING (
    public.is_same_organization(organization_id)
    AND employee_id = public.current_user_employee_id()
  )
  WITH CHECK (
    public.is_same_organization(organization_id)
    AND employee_id = public.current_user_employee_id()
  );

CREATE POLICY career_goals_manage_hr ON public.career_goals
  FOR ALL
  USING (
    public.is_same_organization(organization_id)
    AND (public.current_user_is_hr_admin() OR public.current_user_is_org_admin())
  )
  WITH CHECK (
    public.is_same_organization(organization_id)
    AND (public.current_user_is_hr_admin() OR public.current_user_is_org_admin())
  );

CREATE POLICY growth_plans_select_scoped ON public.growth_plans
  FOR SELECT
  USING (
    public.is_same_organization(organization_id)
    AND public.user_can_read_employee_data(employee_id)
  );

CREATE POLICY growth_plans_write_self ON public.growth_plans
  FOR INSERT
  WITH CHECK (
    public.is_same_organization(organization_id)
    AND employee_id = public.current_user_employee_id()
  );

CREATE POLICY growth_plans_update_self ON public.growth_plans
  FOR UPDATE
  USING (
    public.is_same_organization(organization_id)
    AND employee_id = public.current_user_employee_id()
  )
  WITH CHECK (
    public.is_same_organization(organization_id)
    AND employee_id = public.current_user_employee_id()
  );

CREATE POLICY growth_plans_manage_hr ON public.growth_plans
  FOR ALL
  USING (
    public.is_same_organization(organization_id)
    AND (public.current_user_is_hr_admin() OR public.current_user_is_org_admin())
  )
  WITH CHECK (
    public.is_same_organization(organization_id)
    AND (public.current_user_is_hr_admin() OR public.current_user_is_org_admin())
  );

CREATE POLICY growth_plan_items_select_scoped ON public.growth_plan_items
  FOR SELECT
  USING (
    public.is_same_organization(organization_id)
    AND EXISTS (
      SELECT 1
      FROM growth_plans gp
      WHERE gp.id = growth_plan_id
        AND public.user_can_read_employee_data(gp.employee_id)
    )
  );

CREATE POLICY growth_plan_items_write_self ON public.growth_plan_items
  FOR INSERT
  WITH CHECK (
    public.is_same_organization(organization_id)
    AND EXISTS (
      SELECT 1
      FROM growth_plans gp
      WHERE gp.id = growth_plan_id
        AND gp.employee_id = public.current_user_employee_id()
    )
  );

CREATE POLICY growth_plan_items_update_self ON public.growth_plan_items
  FOR UPDATE
  USING (
    public.is_same_organization(organization_id)
    AND EXISTS (
      SELECT 1
      FROM growth_plans gp
      WHERE gp.id = growth_plan_id
        AND gp.employee_id = public.current_user_employee_id()
    )
  )
  WITH CHECK (
    public.is_same_organization(organization_id)
    AND EXISTS (
      SELECT 1
      FROM growth_plans gp
      WHERE gp.id = growth_plan_id
        AND gp.employee_id = public.current_user_employee_id()
    )
  );

CREATE POLICY growth_plan_items_manage_hr ON public.growth_plan_items
  FOR ALL
  USING (
    public.is_same_organization(organization_id)
    AND (public.current_user_is_hr_admin() OR public.current_user_is_org_admin())
  )
  WITH CHECK (
    public.is_same_organization(organization_id)
    AND (public.current_user_is_hr_admin() OR public.current_user_is_org_admin())
  );

-- ---------------------------------------------------------------------------
-- recommendations & evidence (no executive individual access)
-- ---------------------------------------------------------------------------

CREATE POLICY recommendations_select_scoped ON public.recommendations
  FOR SELECT
  USING (
    public.is_same_organization(organization_id)
    AND public.user_can_read_employee_data(employee_id)
  );

CREATE POLICY recommendations_update_self ON public.recommendations
  FOR UPDATE
  USING (
    public.is_same_organization(organization_id)
    AND employee_id = public.current_user_employee_id()
  )
  WITH CHECK (
    public.is_same_organization(organization_id)
    AND employee_id = public.current_user_employee_id()
  );

CREATE POLICY recommendations_insert_service_roles ON public.recommendations
  FOR INSERT
  WITH CHECK (
    public.is_same_organization(organization_id)
    AND (
      employee_id = public.current_user_employee_id()
      OR public.current_user_is_manager()
      OR public.current_user_is_hr_admin()
      OR public.current_user_is_org_admin()
    )
  );

CREATE POLICY recommendations_manage_hr ON public.recommendations
  FOR ALL
  USING (
    public.is_same_organization(organization_id)
    AND (public.current_user_is_hr_admin() OR public.current_user_is_org_admin())
  )
  WITH CHECK (
    public.is_same_organization(organization_id)
    AND (public.current_user_is_hr_admin() OR public.current_user_is_org_admin())
  );

CREATE POLICY recommendation_evidence_select_scoped ON public.recommendation_evidence
  FOR SELECT
  USING (
    public.is_same_organization(organization_id)
    AND EXISTS (
      SELECT 1
      FROM recommendations r
      WHERE r.id = recommendation_id
        AND public.user_can_read_employee_data(r.employee_id)
    )
  );

CREATE POLICY recommendation_evidence_insert_scoped ON public.recommendation_evidence
  FOR INSERT
  WITH CHECK (
    public.is_same_organization(organization_id)
    AND EXISTS (
      SELECT 1
      FROM recommendations r
      WHERE r.id = recommendation_id
        AND (
          r.employee_id = public.current_user_employee_id()
          OR public.current_user_is_hr_admin()
          OR public.current_user_is_org_admin()
        )
    )
  );

CREATE POLICY recommendation_evidence_manage_hr ON public.recommendation_evidence
  FOR ALL
  USING (
    public.is_same_organization(organization_id)
    AND (public.current_user_is_hr_admin() OR public.current_user_is_org_admin())
  )
  WITH CHECK (
    public.is_same_organization(organization_id)
    AND (public.current_user_is_hr_admin() OR public.current_user_is_org_admin())
  );

-- ---------------------------------------------------------------------------
-- agent_conversations & agent_messages
-- ---------------------------------------------------------------------------

CREATE POLICY agent_conversations_select_scoped ON public.agent_conversations
  FOR SELECT
  USING (
    public.is_same_organization(organization_id)
    AND public.user_can_read_agent_conversation(user_id)
  );

CREATE POLICY agent_conversations_insert_self ON public.agent_conversations
  FOR INSERT
  WITH CHECK (
    public.is_same_organization(organization_id)
    AND user_id = public.current_app_user_id()
  );

CREATE POLICY agent_conversations_update_self ON public.agent_conversations
  FOR UPDATE
  USING (
    public.is_same_organization(organization_id)
    AND user_id = public.current_app_user_id()
  )
  WITH CHECK (
    public.is_same_organization(organization_id)
    AND user_id = public.current_app_user_id()
  );

CREATE POLICY agent_conversations_manage_hr ON public.agent_conversations
  FOR ALL
  USING (
    public.is_same_organization(organization_id)
    AND (public.current_user_is_hr_admin() OR public.current_user_is_org_admin())
  )
  WITH CHECK (
    public.is_same_organization(organization_id)
    AND (public.current_user_is_hr_admin() OR public.current_user_is_org_admin())
  );

CREATE POLICY agent_messages_select_scoped ON public.agent_messages
  FOR SELECT
  USING (
    public.is_same_organization(organization_id)
    AND EXISTS (
      SELECT 1
      FROM agent_conversations ac
      WHERE ac.id = conversation_id
        AND public.user_can_read_agent_conversation(ac.user_id)
    )
  );

CREATE POLICY agent_messages_insert_scoped ON public.agent_messages
  FOR INSERT
  WITH CHECK (
    public.is_same_organization(organization_id)
    AND EXISTS (
      SELECT 1
      FROM agent_conversations ac
      WHERE ac.id = conversation_id
        AND ac.user_id = public.current_app_user_id()
    )
  );

CREATE POLICY agent_messages_manage_hr ON public.agent_messages
  FOR ALL
  USING (
    public.is_same_organization(organization_id)
    AND (public.current_user_is_hr_admin() OR public.current_user_is_org_admin())
  )
  WITH CHECK (
    public.is_same_organization(organization_id)
    AND (public.current_user_is_hr_admin() OR public.current_user_is_org_admin())
  );

-- ---------------------------------------------------------------------------
-- data_readiness_scores (executive_readonly: aggregate/readiness only)
-- ---------------------------------------------------------------------------

CREATE POLICY data_readiness_scores_select_analytics ON public.data_readiness_scores
  FOR SELECT
  USING (
    public.is_same_organization(organization_id)
    AND (
      public.current_user_is_hr_admin()
      OR public.current_user_is_org_admin()
      OR public.current_user_is_executive_readonly()
    )
  );

CREATE POLICY data_readiness_scores_manage_hr ON public.data_readiness_scores
  FOR ALL
  USING (
    public.is_same_organization(organization_id)
    AND (public.current_user_is_hr_admin() OR public.current_user_is_org_admin())
  )
  WITH CHECK (
    public.is_same_organization(organization_id)
    AND (public.current_user_is_hr_admin() OR public.current_user_is_org_admin())
  );

-- ---------------------------------------------------------------------------
-- audit_logs (hr_admin + org_admin only; employees/managers denied)
-- ---------------------------------------------------------------------------

CREATE POLICY audit_logs_select_hr ON public.audit_logs
  FOR SELECT
  USING (
    public.is_same_organization(organization_id)
    AND (public.current_user_is_hr_admin() OR public.current_user_is_org_admin())
  );

CREATE POLICY audit_logs_insert_org_member ON public.audit_logs
  FOR INSERT
  WITH CHECK (
    public.is_same_organization(organization_id)
    AND user_id = public.current_app_user_id()
  );

CREATE POLICY audit_logs_manage_org_admin ON public.audit_logs
  FOR DELETE
  USING (
    public.is_same_organization(organization_id)
    AND public.current_user_is_org_admin()
  );

-- ---------------------------------------------------------------------------
-- permissions (global catalog — read for authenticated org members)
-- ---------------------------------------------------------------------------

CREATE POLICY permissions_select_authenticated ON public.permissions
  FOR SELECT
  USING (public.current_app_user_id() IS NOT NULL);

CREATE POLICY permissions_manage_org_admin ON public.permissions
  FOR ALL
  USING (public.current_user_is_org_admin())
  WITH CHECK (public.current_user_is_org_admin());

-- ---------------------------------------------------------------------------
-- user_roles
-- ---------------------------------------------------------------------------

CREATE POLICY user_roles_select_self ON public.user_roles
  FOR SELECT
  USING (user_id = public.current_app_user_id());

CREATE POLICY user_roles_select_org_admin ON public.user_roles
  FOR SELECT
  USING (
    public.is_same_organization(organization_id)
    AND public.current_user_is_org_admin()
  );

CREATE POLICY user_roles_manage_org_admin ON public.user_roles
  FOR ALL
  USING (
    public.is_same_organization(organization_id)
    AND public.current_user_is_org_admin()
  )
  WITH CHECK (
    public.is_same_organization(organization_id)
    AND public.current_user_is_org_admin()
  );

-- ---------------------------------------------------------------------------
-- Grants for authenticated role (Supabase)
-- ---------------------------------------------------------------------------

GRANT EXECUTE ON FUNCTION public.current_app_user_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_organization_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_employee_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_has_role(public.user_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_is_org_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_is_hr_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_is_manager() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_is_employee() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_is_executive_readonly() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_same_organization(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.manager_can_read_employee(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_can_read_employee_data(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_can_read_org_user(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_can_read_agent_conversation(uuid) TO authenticated;
