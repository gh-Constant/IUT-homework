--
-- PostgreSQL database dump
--

-- Dumped from database version 15.6
-- Dumped by pg_dump version 15.10 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: delete_user_and_owned_data(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.delete_user_and_owned_data(user_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
begin
  -- Delete only the devoirs created by this user
  delete from devoirs where created_by = user_id;
  
  -- Delete the user
  delete from users where id = user_id;
end;
$$;


--
-- Name: delete_user_data(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.delete_user_data(user_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $_$
BEGIN
    -- Supprimer les devoirs créés par l'utilisateur
    DELETE FROM assignments
    WHERE created_by = $1;

    -- Supprimer les devoirs où l'utilisateur est ciblé
    DELETE FROM assignments
    WHERE target_type = 'personal' 
    AND $1 = ANY(target_users);

    -- Supprimer l'utilisateur
    DELETE FROM users
    WHERE id = $1;
END;
$_$;


--
-- Name: update_assignment(uuid, text, text, text, timestamp with time zone, text, text[], uuid[]); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_assignment(assignment_id uuid, title text, description text, subject text, due_date timestamp with time zone, target_type text, target_groups text[], target_users uuid[]) RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
begin
  update assignments
  set 
    title = update_assignment.title,
    description = update_assignment.description,
    subject = update_assignment.subject,
    due_date = update_assignment.due_date,
    target_type = update_assignment.target_type,
    target_groups = update_assignment.target_groups,
    target_users = update_assignment.target_users,
    updated_at = now()
  where id = assignment_id;
  
  return json_build_object(
    'success', true,
    'message', 'Assignment updated successfully'
  );
end;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: assignments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.assignments (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    title text NOT NULL,
    description text,
    subject text NOT NULL,
    due_date timestamp with time zone NOT NULL,
    completed boolean DEFAULT false,
    created_by uuid NOT NULL,
    target_type text NOT NULL,
    target_groups text[] DEFAULT ARRAY[]::text[],
    target_users uuid[] DEFAULT ARRAY[]::uuid[],
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    links jsonb DEFAULT '[]'::jsonb,
    CONSTRAINT assignments_subject_check CHECK ((subject = ANY (ARRAY['Communication'::text, 'SAE'::text, 'Anglais'::text, 'Informatique'::text, 'Management'::text, 'Marketing'::text]))),
    CONSTRAINT assignments_target_type_check CHECK ((target_type = ANY (ARRAY['global'::text, 'group'::text, 'personal'::text])))
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    username text NOT NULL,
    pin text NOT NULL,
    category text NOT NULL,
    role text DEFAULT 'user'::text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    CONSTRAINT users_category_check CHECK ((category = ANY (ARRAY['C2'::text, 'C1'::text, 'B2'::text, 'B1'::text, 'A2'::text, 'A1'::text]))),
    CONSTRAINT users_pin_check CHECK ((length(pin) = 6)),
    CONSTRAINT users_role_check CHECK ((role = ANY (ARRAY['user'::text, 'admin'::text])))
);


--
-- Data for Name: assignments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.assignments (id, title, description, subject, due_date, completed, created_by, target_type, target_groups, target_users, created_at, links) FROM stdin;
fe4c8278-b68f-47ae-aa91-3b026203f7e9	Anglais ◊ Oral Space ◊	<p><strong>j'adore les hommese</strong></p>	Anglais	2024-11-27 00:00:00+00	f	cf8a0cda-4a57-4390-bc3c-7b0443ec5e2d	group	{C2}	{}	2024-11-27 08:57:25.820516+00	[]
08e98672-df6a-4e58-84da-a9f3aedd08dd	SAE 1.03 Creation VM & Rapport à rendre	<p><br></p>	Anglais	2024-11-29 00:00:00+00	f	cf8a0cda-4a57-4390-bc3c-7b0443ec5e2d	global	{}	{}	2024-11-27 08:59:51.794712+00	[]
e3c3cca3-b8ff-443d-ac34-aadad109da04	Bases de la Communication	<p>- Surligner : Texte sur Bluesky</p><p>- Déposer sur Moodle</p>	Communication	2024-12-02 20:00:00+00	f	5c50d29d-4644-4394-b52d-925f72d37be5	group	{C2,C1}	{}	2024-11-27 09:15:20.388092+00	[]
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, username, pin, category, role, created_at) FROM stdin;
e6608535-c461-43b4-bd90-7a4b1bf08636	admin	123456	C2	admin	2024-11-26 09:20:50.825934+00
1a1960e1-7cc1-4fc7-b41f-af78af19d46a	what	042222	C2	user	2024-11-26 14:28:20.900355+00
19386554-09a2-4de2-9722-13f93d375678	tahar	123456	C2	user	2024-11-26 17:36:43.311071+00
c5fead6a-0bdc-4899-a516-568624665918	constant	000000	B1	user	2024-11-27 08:51:52.613948+00
cf8a0cda-4a57-4390-bc3c-7b0443ec5e2d	constantsuchet	000000	C2	user	2024-11-27 08:52:41.91802+00
5c50d29d-4644-4394-b52d-925f72d37be5	KGameX_VK	314159	C2	user	2024-11-27 09:11:46.364326+00
a2a9c800-d350-4700-9618-14a5d5b2c797	TimotheGay	123456	C2	user	2024-11-27 09:11:52.282787+00
\.


--
-- Name: assignments assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT assignments_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: idx_assignments_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assignments_created_by ON public.assignments USING btree (created_by);


--
-- Name: idx_assignments_due_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assignments_due_date ON public.assignments USING btree (due_date);


--
-- Name: idx_assignments_target_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assignments_target_type ON public.assignments USING btree (target_type);


--
-- Name: idx_users_role; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_role ON public.users USING btree (role);


--
-- Name: idx_users_username; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_username ON public.users USING btree (username);


--
-- Name: assignments assignments_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT assignments_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: assignments Admins can delete any assignments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete any assignments" ON public.assignments FOR DELETE USING ((auth.role() = 'admin'::text));


--
-- Name: users Admins can delete any user; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete any user" ON public.users FOR DELETE USING ((auth.uid() IN ( SELECT users_1.id
   FROM public.users users_1
  WHERE (users_1.role = 'admin'::text))));


--
-- Name: users Admins can delete any user and their assignments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete any user and their assignments" ON public.users FOR DELETE USING ((auth.uid() IN ( SELECT users_1.id
   FROM public.users users_1
  WHERE (users_1.role = 'admin'::text))));


--
-- Name: users Admins can delete any users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete any users" ON public.users FOR DELETE USING ((auth.role() = 'admin'::text));


--
-- Name: users Enable delete for admin users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable delete for admin users" ON public.users FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.users users_1
  WHERE ((users_1.id = auth.uid()) AND (users_1.role = 'admin'::text)))));


--
-- Name: assignments Enable delete for admin users or personal assignments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable delete for admin users or personal assignments" ON public.assignments FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.id = auth.uid()) AND ((users.role = 'admin'::text) OR ((assignments.target_type = 'personal'::text) AND (assignments.target_users @> ARRAY[users.id])))))));


--
-- Name: assignments Enable delete for assignments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable delete for assignments" ON public.assignments FOR DELETE USING (true);


--
-- Name: users Enable delete for users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable delete for users" ON public.users FOR DELETE USING ((auth.role() = 'admin'::text));


--
-- Name: assignments Enable insert for assignments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable insert for assignments" ON public.assignments FOR INSERT WITH CHECK (true);


--
-- Name: users Enable insert for authentication; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable insert for authentication" ON public.users FOR INSERT WITH CHECK (true);


--
-- Name: users Enable insert for users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable insert for users" ON public.users FOR INSERT WITH CHECK (true);


--
-- Name: assignments Enable read access for assignments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable read access for assignments" ON public.assignments FOR SELECT USING (true);


--
-- Name: users Enable read access for users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable read access for users" ON public.users FOR SELECT USING (true);


--
-- Name: assignments Enable update for assignments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable update for assignments" ON public.assignments FOR UPDATE USING (true);


--
-- Name: users Enable update for users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable update for users" ON public.users FOR UPDATE USING (true);


--
-- Name: users Public read access for users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read access for users" ON public.users FOR SELECT USING (true);


--
-- Name: users Users can be viewed by anyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can be viewed by anyone" ON public.users FOR SELECT USING (true);


--
-- Name: assignments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

--
-- Name: users; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--

