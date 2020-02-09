--
-- PostgreSQL database dump
--

-- Dumped from database version 10.7
-- Dumped by pg_dump version 10.10 (Ubuntu 10.10-0ubuntu0.18.04.1)

--
-- Name: assignment; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.assignment (
    id integer NOT NULL,
    user_id integer NOT NULL,
    campaign_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    max_contacts integer
);


--
-- Name: assignment_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.assignment_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: assignment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.assignment_id_seq OWNED BY public.assignment.id;


--
-- Name: campaign; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.campaign (
    id integer NOT NULL,
    organization_id integer NOT NULL,
    creator_id integer,
    title text DEFAULT ''::text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    is_started boolean,
    due_by timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    is_archived boolean,
    use_dynamic_assignment boolean,
    logo_image_url text,
    intro_html text,
    primary_color text,
    override_organization_texting_hours boolean DEFAULT false,
    texting_hours_enforced boolean DEFAULT true,
    texting_hours_start integer DEFAULT 9,
    texting_hours_end integer DEFAULT 21,
    timezone text DEFAULT 'US/Eastern'::text,
    messaging_service_sid character varying(255)
);


--
-- Name: campaign_contact; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.campaign_contact (
    id integer NOT NULL,
    campaign_id integer NOT NULL,
    assignment_id integer,
    external_id text DEFAULT ''::text NOT NULL,
    first_name text DEFAULT ''::text NOT NULL,
    last_name text DEFAULT ''::text NOT NULL,
    cell text NOT NULL,
    zip text DEFAULT ''::text NOT NULL,
    custom_fields text DEFAULT '{}'::text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    message_status text DEFAULT 'needsMessage'::text NOT NULL,
    is_opted_out boolean DEFAULT false,
    timezone_offset text DEFAULT ''::text,
    has_unresolved_tags boolean DEFAULT false,
    external_id_type character varying(255) DEFAULT NULL::character varying,
    state_code character varying(255) DEFAULT NULL::character varying
);


--
-- Name: campaign_contact_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.campaign_contact_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: campaign_contact_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.campaign_contact_id_seq OWNED BY public.campaign_contact.id;


--
-- Name: campaign_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.campaign_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: campaign_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.campaign_id_seq OWNED BY public.campaign.id;


--
-- Name: canned_response; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.canned_response (
    id integer NOT NULL,
    campaign_id integer NOT NULL,
    text text NOT NULL,
    title text NOT NULL,
    user_id integer,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    survey_question character varying(255) DEFAULT NULL::character varying
);


--
-- Name: canned_response_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.canned_response_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: canned_response_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.canned_response_id_seq OWNED BY public.canned_response.id;


--
-- Name: interaction_step; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.interaction_step (
    id integer NOT NULL,
    campaign_id integer NOT NULL,
    question text DEFAULT ''::text NOT NULL,
    script text DEFAULT ''::text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    parent_interaction_id integer,
    answer_option text DEFAULT ''::text NOT NULL,
    answer_actions text DEFAULT ''::text NOT NULL,
    is_deleted boolean DEFAULT false NOT NULL
);


--
-- Name: interaction_step_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.interaction_step_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: interaction_step_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.interaction_step_id_seq OWNED BY public.interaction_step.id;


--
-- Name: invite; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invite (
    id integer NOT NULL,
    is_valid boolean NOT NULL,
    hash text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: invite_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.invite_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: invite_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.invite_id_seq OWNED BY public.invite.id;


--
-- Name: job_request; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.job_request (
    id integer NOT NULL,
    campaign_id integer NOT NULL,
    payload text NOT NULL,
    queue_name text NOT NULL,
    job_type text NOT NULL,
    result_message text DEFAULT ''::text,
    locks_queue boolean DEFAULT false,
    assigned boolean DEFAULT false,
    status integer DEFAULT 0,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: job_request_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.job_request_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: job_request_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.job_request_id_seq OWNED BY public.job_request.id;


--
-- Name: log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.log (
    id integer NOT NULL,
    message_sid text NOT NULL,
    body text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: log_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.log_id_seq OWNED BY public.log.id;


--
-- Name: message; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.message (
    id integer NOT NULL,
    user_id integer,
    user_number text DEFAULT ''::text NOT NULL,
    contact_number text NOT NULL,
    is_from_contact boolean NOT NULL,
    text text DEFAULT ''::text NOT NULL,
    service_response text DEFAULT ''::text NOT NULL,
    assignment_id integer NOT NULL,
    service text DEFAULT ''::text NOT NULL,
    service_id text DEFAULT ''::text NOT NULL,
    send_status text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    queued_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    sent_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    service_response_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    send_before timestamp with time zone,
    messaging_service_sid character varying(255),
    canned_response_id integer
);


--
-- Name: message_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.message_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: message_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.message_id_seq OWNED BY public.message.id;


--
-- Name: migrations; Type: TABLE; Schema: public; Owner: -
--

-- CREATE TABLE public.migrations (
--     id integer NOT NULL,
--     completed integer NOT NULL
-- );


-- --
-- -- Name: migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
-- --

-- CREATE SEQUENCE public.migrations_id_seq
--     AS integer
--     START WITH 1
--     INCREMENT BY 1
--     NO MINVALUE
--     NO MAXVALUE
--     CACHE 1;


--
-- Name: migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

-- ALTER SEQUENCE public.migrations_id_seq OWNED BY public.migrations.id; --


--
-- Name: opt_out; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.opt_out (
    id integer NOT NULL,
    cell text NOT NULL,
    assignment_id integer,
    organization_id integer NOT NULL,
    reason_code text DEFAULT ''::text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: opt_out_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.opt_out_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: opt_out_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.opt_out_id_seq OWNED BY public.opt_out.id;


--
-- Name: organization; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.organization (
    id integer NOT NULL,
    uuid text,
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    features text DEFAULT ''::text,
    texting_hours_enforced boolean DEFAULT false,
    texting_hours_start integer DEFAULT 9,
    texting_hours_end integer DEFAULT 21
);


--
-- Name: organization_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.organization_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: organization_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.organization_id_seq OWNED BY public.organization.id;


--
-- Name: pending_message_part; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pending_message_part (
    id integer NOT NULL,
    service text NOT NULL,
    service_id text NOT NULL,
    parent_id text DEFAULT ''::text,
    service_message text NOT NULL,
    user_number text DEFAULT ''::text NOT NULL,
    contact_number text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: pending_message_part_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.pending_message_part_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: pending_message_part_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.pending_message_part_id_seq OWNED BY public.pending_message_part.id;


--
-- Name: question_response; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.question_response (
    id integer NOT NULL,
    campaign_contact_id integer NOT NULL,
    interaction_step_id integer NOT NULL,
    value text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: question_response_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.question_response_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: question_response_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.question_response_id_seq OWNED BY public.question_response.id;


--
-- Name: tag; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tag (
    id integer NOT NULL,
    campaign_contact_id integer NOT NULL,
    tag text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by integer,
    resolved_at timestamp with time zone,
    resolved_by integer
);


--
-- Name: tag_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tag_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tag_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tag_id_seq OWNED BY public.tag.id;


--
-- Name: user; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."user" (
    id integer NOT NULL,
    auth0_id text NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    cell text NOT NULL,
    email text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    assigned_cell text,
    is_superadmin boolean,
    terms boolean DEFAULT false
);


--
-- Name: user_cell; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_cell (
    id integer NOT NULL,
    cell text NOT NULL,
    user_id integer NOT NULL,
    service text,
    is_primary boolean
);


--
-- Name: user_cell_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_cell_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_cell_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_cell_id_seq OWNED BY public.user_cell.id;


--
-- Name: user_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_id_seq OWNED BY public."user".id;


--
-- Name: user_organization; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_organization (
    id integer NOT NULL,
    user_id integer NOT NULL,
    organization_id integer NOT NULL,
    role text NOT NULL
);


--
-- Name: user_organization_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_organization_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_organization_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_organization_id_seq OWNED BY public.user_organization.id;


--
-- Name: zip_code; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.zip_code (
    zip text NOT NULL,
    city text NOT NULL,
    state text NOT NULL,
    latitude real NOT NULL,
    longitude real NOT NULL,
    timezone_offset real NOT NULL,
    has_dst boolean NOT NULL
);


--
-- Name: assignment id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignment ALTER COLUMN id SET DEFAULT nextval('public.assignment_id_seq'::regclass);


--
-- Name: campaign id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaign ALTER COLUMN id SET DEFAULT nextval('public.campaign_id_seq'::regclass);


--
-- Name: campaign_contact id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaign_contact ALTER COLUMN id SET DEFAULT nextval('public.campaign_contact_id_seq'::regclass);


--
-- Name: canned_response id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.canned_response ALTER COLUMN id SET DEFAULT nextval('public.canned_response_id_seq'::regclass);


--
-- Name: interaction_step id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.interaction_step ALTER COLUMN id SET DEFAULT nextval('public.interaction_step_id_seq'::regclass);


--
-- Name: invite id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invite ALTER COLUMN id SET DEFAULT nextval('public.invite_id_seq'::regclass);


--
-- Name: job_request id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_request ALTER COLUMN id SET DEFAULT nextval('public.job_request_id_seq'::regclass);


--
-- Name: log id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.log ALTER COLUMN id SET DEFAULT nextval('public.log_id_seq'::regclass);


--
-- Name: message id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message ALTER COLUMN id SET DEFAULT nextval('public.message_id_seq'::regclass);


--
-- Name: migrations id; Type: DEFAULT; Schema: public; Owner: -
--

-- ALTER TABLE ONLY public.migrations ALTER COLUMN id SET DEFAULT nextval('public.migrations_id_seq'::regclass);


--
-- Name: opt_out id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.opt_out ALTER COLUMN id SET DEFAULT nextval('public.opt_out_id_seq'::regclass);


--
-- Name: organization id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organization ALTER COLUMN id SET DEFAULT nextval('public.organization_id_seq'::regclass);


--
-- Name: pending_message_part id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pending_message_part ALTER COLUMN id SET DEFAULT nextval('public.pending_message_part_id_seq'::regclass);


--
-- Name: question_response id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.question_response ALTER COLUMN id SET DEFAULT nextval('public.question_response_id_seq'::regclass);


--
-- Name: tag id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tag ALTER COLUMN id SET DEFAULT nextval('public.tag_id_seq'::regclass);


--
-- Name: user id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."user" ALTER COLUMN id SET DEFAULT nextval('public.user_id_seq'::regclass);


--
-- Name: user_cell id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_cell ALTER COLUMN id SET DEFAULT nextval('public.user_cell_id_seq'::regclass);


--
-- Name: user_organization id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_organization ALTER COLUMN id SET DEFAULT nextval('public.user_organization_id_seq'::regclass);


--
-- Name: assignment assignment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignment
    ADD CONSTRAINT assignment_pkey PRIMARY KEY (id);


--
-- Name: campaign_contact campaign_contact_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaign_contact
    ADD CONSTRAINT campaign_contact_pkey PRIMARY KEY (id);


--
-- Name: campaign campaign_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaign
    ADD CONSTRAINT campaign_pkey PRIMARY KEY (id);


--
-- Name: canned_response canned_response_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.canned_response
    ADD CONSTRAINT canned_response_pkey PRIMARY KEY (id);


--
-- Name: interaction_step interaction_step_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.interaction_step
    ADD CONSTRAINT interaction_step_pkey PRIMARY KEY (id);


--
-- Name: invite invite_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invite
    ADD CONSTRAINT invite_pkey PRIMARY KEY (id);


--
-- Name: job_request job_request_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_request
    ADD CONSTRAINT job_request_pkey PRIMARY KEY (id);


--
-- Name: log log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.log
    ADD CONSTRAINT log_pkey PRIMARY KEY (id);


--
-- Name: message message_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message
    ADD CONSTRAINT message_pkey PRIMARY KEY (id);


--
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

-- ALTER TABLE ONLY public.migrations
   -- ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);


--
-- Name: opt_out opt_out_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.opt_out
    ADD CONSTRAINT opt_out_pkey PRIMARY KEY (id);


--
-- Name: organization organization_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organization
    ADD CONSTRAINT organization_pkey PRIMARY KEY (id);


--
-- Name: pending_message_part pending_message_part_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pending_message_part
    ADD CONSTRAINT pending_message_part_pkey PRIMARY KEY (id);


--
-- Name: question_response question_response_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.question_response
    ADD CONSTRAINT question_response_pkey PRIMARY KEY (id);


--
-- Name: tag tag_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tag
    ADD CONSTRAINT tag_pkey PRIMARY KEY (id);


--
-- Name: user user_auth0_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_auth0_id_unique UNIQUE (auth0_id);


--
-- Name: user_cell user_cell_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_cell
    ADD CONSTRAINT user_cell_pkey PRIMARY KEY (id);


--
-- Name: user_organization user_organization_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_organization
    ADD CONSTRAINT user_organization_pkey PRIMARY KEY (id);


--
-- Name: user user_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_pkey PRIMARY KEY (id);


--
-- Name: zip_code zip_code_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.zip_code
    ADD CONSTRAINT zip_code_pkey PRIMARY KEY (zip);


--
-- Name: assignment_campaign_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX assignment_campaign_id_index ON public.assignment USING btree (campaign_id);


--
-- Name: assignment_user_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX assignment_user_id_index ON public.assignment USING btree (user_id);


--
-- Name: campaign_contact_assignment_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX campaign_contact_assignment_id_index ON public.campaign_contact USING btree (assignment_id);


--
-- Name: campaign_contact_assignment_id_timezone_offset_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX campaign_contact_assignment_id_timezone_offset_index ON public.campaign_contact USING btree (assignment_id, timezone_offset);


--
-- Name: campaign_contact_campaign_id_assignment_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX campaign_contact_campaign_id_assignment_id_index ON public.campaign_contact USING btree (campaign_id, assignment_id);


--
-- Name: campaign_contact_campaign_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX campaign_contact_campaign_id_index ON public.campaign_contact USING btree (campaign_id);


--
-- Name: campaign_contact_cell_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX campaign_contact_cell_index ON public.campaign_contact USING btree (cell);


--
-- Name: campaign_creator_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX campaign_creator_id_index ON public.campaign USING btree (creator_id);


--
-- Name: campaign_organization_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX campaign_organization_id_index ON public.campaign USING btree (organization_id);


--
-- Name: canned_response_campaign_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX canned_response_campaign_id_index ON public.canned_response USING btree (campaign_id);


--
-- Name: canned_response_user_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX canned_response_user_id_index ON public.canned_response USING btree (user_id);


--
-- Name: interaction_step_campaign_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX interaction_step_campaign_id_index ON public.interaction_step USING btree (campaign_id);


--
-- Name: interaction_step_parent_interaction_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX interaction_step_parent_interaction_id_index ON public.interaction_step USING btree (parent_interaction_id);


--
-- Name: invite_is_valid_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX invite_is_valid_index ON public.invite USING btree (is_valid);


--
-- Name: job_request_queue_name_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX job_request_queue_name_index ON public.job_request USING btree (queue_name);


--
-- Name: message_assignment_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX message_assignment_id_index ON public.message USING btree (assignment_id);


--
-- Name: message_contact_number_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX message_contact_number_index ON public.message USING btree (contact_number);


--
-- Name: message_messaging_service_sid_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX message_messaging_service_sid_index ON public.message USING btree (messaging_service_sid);


--
-- Name: message_send_status_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX message_send_status_index ON public.message USING btree (send_status);


--
-- Name: message_service_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX message_service_id_index ON public.message USING btree (service_id);


--
-- Name: message_user_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX message_user_id_index ON public.message USING btree (user_id);


--
-- Name: message_user_number_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX message_user_number_index ON public.message USING btree (user_number);


--
-- Name: opt_out_assignment_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX opt_out_assignment_id_index ON public.opt_out USING btree (assignment_id);


--
-- Name: opt_out_cell_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX opt_out_cell_index ON public.opt_out USING btree (cell);


--
-- Name: opt_out_organization_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX opt_out_organization_id_index ON public.opt_out USING btree (organization_id);


--
-- Name: pending_message_part_parent_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX pending_message_part_parent_id_index ON public.pending_message_part USING btree (parent_id);


--
-- Name: pending_message_part_service_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX pending_message_part_service_index ON public.pending_message_part USING btree (service);


--
-- Name: question_response_campaign_contact_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX question_response_campaign_contact_id_index ON public.question_response USING btree (campaign_contact_id);


--
-- Name: question_response_interaction_step_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX question_response_interaction_step_id_index ON public.question_response USING btree (interaction_step_id);


--
-- Name: tag_campaign_contact_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tag_campaign_contact_id_index ON public.tag USING btree (campaign_contact_id);


--
-- Name: tag_tag_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tag_tag_index ON public.tag USING btree (tag);


--
-- Name: user_auth0_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX user_auth0_id_index ON public."user" USING btree (auth0_id);


--
-- Name: user_cell_user_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX user_cell_user_id_index ON public.user_cell USING btree (user_id);


--
-- Name: user_email_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX user_email_index ON public."user" USING btree (email);


--
-- Name: user_organization_organization_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX user_organization_organization_id_index ON public.user_organization USING btree (organization_id);


--
-- Name: user_organization_organization_id_user_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX user_organization_organization_id_user_id_index ON public.user_organization USING btree (organization_id, user_id);


--
-- Name: user_organization_user_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX user_organization_user_id_index ON public.user_organization USING btree (user_id);


--
-- Name: assignment assignment_campaign_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignment
    ADD CONSTRAINT assignment_campaign_id_foreign FOREIGN KEY (campaign_id) REFERENCES public.campaign(id);


--
-- Name: assignment assignment_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignment
    ADD CONSTRAINT assignment_user_id_foreign FOREIGN KEY (user_id) REFERENCES public."user"(id);


--
-- Name: campaign_contact campaign_contact_assignment_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaign_contact
    ADD CONSTRAINT campaign_contact_assignment_id_foreign FOREIGN KEY (assignment_id) REFERENCES public.assignment(id);


--
-- Name: campaign_contact campaign_contact_campaign_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaign_contact
    ADD CONSTRAINT campaign_contact_campaign_id_foreign FOREIGN KEY (campaign_id) REFERENCES public.campaign(id);


--
-- Name: campaign campaign_creator_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaign
    ADD CONSTRAINT campaign_creator_id_foreign FOREIGN KEY (creator_id) REFERENCES public."user"(id);


--
-- Name: campaign campaign_organization_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaign
    ADD CONSTRAINT campaign_organization_id_foreign FOREIGN KEY (organization_id) REFERENCES public.organization(id);


--
-- Name: canned_response canned_response_campaign_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.canned_response
    ADD CONSTRAINT canned_response_campaign_id_foreign FOREIGN KEY (campaign_id) REFERENCES public.campaign(id);


--
-- Name: canned_response canned_response_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.canned_response
    ADD CONSTRAINT canned_response_user_id_foreign FOREIGN KEY (user_id) REFERENCES public."user"(id);


--
-- Name: interaction_step interaction_step_campaign_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.interaction_step
    ADD CONSTRAINT interaction_step_campaign_id_foreign FOREIGN KEY (campaign_id) REFERENCES public.campaign(id);


--
-- Name: interaction_step interaction_step_parent_interaction_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.interaction_step
    ADD CONSTRAINT interaction_step_parent_interaction_id_foreign FOREIGN KEY (parent_interaction_id) REFERENCES public.interaction_step(id);


--
-- Name: job_request job_request_campaign_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_request
    ADD CONSTRAINT job_request_campaign_id_foreign FOREIGN KEY (campaign_id) REFERENCES public.campaign(id);


--
-- Name: message message_assignment_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message
    ADD CONSTRAINT message_assignment_id_foreign FOREIGN KEY (assignment_id) REFERENCES public.assignment(id);


--
-- Name: message message_canned_response_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message
    ADD CONSTRAINT message_canned_response_id_foreign FOREIGN KEY (canned_response_id) REFERENCES public.canned_response(id);


--
-- Name: message message_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message
    ADD CONSTRAINT message_user_id_foreign FOREIGN KEY (user_id) REFERENCES public."user"(id);


--
-- Name: opt_out opt_out_assignment_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.opt_out
    ADD CONSTRAINT opt_out_assignment_id_foreign FOREIGN KEY (assignment_id) REFERENCES public.assignment(id);


--
-- Name: opt_out opt_out_organization_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.opt_out
    ADD CONSTRAINT opt_out_organization_id_foreign FOREIGN KEY (organization_id) REFERENCES public.organization(id);


--
-- Name: question_response question_response_campaign_contact_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.question_response
    ADD CONSTRAINT question_response_campaign_contact_id_foreign FOREIGN KEY (campaign_contact_id) REFERENCES public.campaign_contact(id);


--
-- Name: question_response question_response_interaction_step_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.question_response
    ADD CONSTRAINT question_response_interaction_step_id_foreign FOREIGN KEY (interaction_step_id) REFERENCES public.interaction_step(id);


--
-- Name: tag tag_campaign_contact_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tag
    ADD CONSTRAINT tag_campaign_contact_id_foreign FOREIGN KEY (campaign_contact_id) REFERENCES public.campaign_contact(id);


--
-- Name: tag tag_created_by_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tag
    ADD CONSTRAINT tag_created_by_foreign FOREIGN KEY (created_by) REFERENCES public."user"(id);


--
-- Name: tag tag_resolved_by_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tag
    ADD CONSTRAINT tag_resolved_by_foreign FOREIGN KEY (resolved_by) REFERENCES public."user"(id);


--
-- Name: user_cell user_cell_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_cell
    ADD CONSTRAINT user_cell_user_id_foreign FOREIGN KEY (user_id) REFERENCES public."user"(id);


--
-- Name: user_organization user_organization_organization_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_organization
    ADD CONSTRAINT user_organization_organization_id_foreign FOREIGN KEY (organization_id) REFERENCES public.organization(id);


--
-- Name: user_organization user_organization_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_organization
    ADD CONSTRAINT user_organization_user_id_foreign FOREIGN KEY (user_id) REFERENCES public."user"(id);
