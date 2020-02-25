import { IndexRoute, IndexRedirect, Route } from "react-router";
import React from "react";

const App = React.lazy(() => import("src/components/App"));
const AdminDashboard = React.lazy(() =>
  import("src/components/AdminDashboard")
);
const AdminCampaignList = React.lazy(() =>
  import("src/containers/AdminCampaignList")
);
const AdminCampaignStats = React.lazy(() =>
  import("src/containers/AdminCampaignStats")
);
const AdminPersonList = React.lazy(() =>
  import("src/containers/AdminPersonList")
);
const AdminIncomingMessageList = React.lazy(() =>
  import("src/containers/AdminIncomingMessageList")
);
const AdminCampaignEdit = React.lazy(() =>
  import("src/containers/AdminCampaignEdit")
);
const TexterDashboard = React.lazy(() =>
  import("src/components/TexterDashboard")
);
const TopNav = React.lazy(() => import("src/components/TopNav"));
const DashboardLoader = React.lazy(() =>
  import("src/containers/DashboardLoader")
);
const TexterTodoList = React.lazy(() =>
  import("src/containers/TexterTodoList")
);
const ConversationTexter = React.lazy(() =>
  import("src/containers/ConversationTexter")
);
const SuspendedTexter = React.lazy(() =>
  import("src/containers/SuspendedTexter")
);
const Login = React.lazy(() => import("src/components/Login"));
const Terms = React.lazy(() => import("src/containers/Terms"));
const CreateOrganization = React.lazy(() =>
  import("src/containers/CreateOrganization")
);
const JoinCampaign = React.lazy(() => import("src/containers/JoinCampaign"));
const Home = React.lazy(() => import("src/containers/Home"));
const Settings = React.lazy(() => import("src/containers/Settings"));
const UserEdit = React.lazy(() => import("src/containers/UserEdit"));
const TexterFaqs = React.lazy(() =>
  import("src/components/TexterFrequentlyAskedQuestions")
);
const FAQs = React.lazy(() => import("src/lib/faqs"));
const AdminCampaignCreate = React.lazy(() =>
  import("src/containers/AdminCampaignCreate")
);
const InitialMessageTexter = React.lazy(() =>
  import("src/containers/AssignmentTexter/InitialMessageTexter")
);
const SingleAssignmentSummary = React.lazy(() =>
  import("src/containers/SingleAssignmentSummary")
);
const Error404 = React.lazy(() => import("src/components/Error404"));

export default function makeRoutes(requireAuth = () => {}) {
  return (
    <Route path="/" component={App}>
      <IndexRoute component={Home} />
      <Route path="admin" component={AdminDashboard} onEnter={requireAuth}>
        <IndexRoute component={() => <DashboardLoader path="/admin" />} />
        <Route path=":organizationId">
          <IndexRedirect to="campaigns" />
          <Route path="campaigns">
            <IndexRoute component={AdminCampaignList} />
            <Route path="new" component={AdminCampaignCreate} />
            <Route path=":campaignId">
              <IndexRoute component={AdminCampaignStats} />
              <Route path="edit" component={AdminCampaignEdit} />
              <Route path="review" component={AdminIncomingMessageList} />
            </Route>
          </Route>
          <Route path="people" component={AdminPersonList} />
          <Route path="settings" component={Settings} />
        </Route>
      </Route>
      <Route path="app" component={TexterDashboard} onEnter={requireAuth}>
        <IndexRoute
          components={{
            main: () => <DashboardLoader path="/app" />,
            topNav: p => (
              <TopNav title="Spoke" orgId={p.params.organizationId} />
            ),
            fullScreen: null
          }}
        />
        <Route path=":organizationId">
          <IndexRedirect to="todos" />
          <Route
            path="faqs"
            components={{
              main: () => <TexterFaqs faqs={FAQs} />,
              topNav: p => (
                <TopNav title="Account" orgId={p.params.organizationId} />
              )
            }}
          />
          <Route
            path="account/:userId"
            components={{
              main: p => (
                <UserEdit
                  userId={p.params.userId}
                  organizationId={p.params.organizationId}
                />
              ),
              topNav: p => (
                <TopNav title="Account" orgId={p.params.organizationId} />
              )
            }}
          />
          <Route
            path="suspended"
            components={{
              main: p => (
                <SuspendedTexter organizationId={p.params.organizationId} />
              ),
              topNav: p => (
                <TopNav title="Spoke" orgId={p.params.organizationId} />
              )
            }}
          />
          <Route path="todos">
            <IndexRoute
              components={{
                main: TexterTodoList,
                topNav: p => (
                  <TopNav title="Spoke" orgId={p.params.organizationId} />
                )
              }}
            />
            <Route path=":assignmentId">
              <Route
                path="overview"
                components={{
                  main: SingleAssignmentSummary,
                  topNav: p => (
                    <TopNav title="Spoke" orgId={p.params.organizationId} />
                  )
                }}
              />
              <Route
                path="text"
                components={{
                  fullScreen: props => <InitialMessageTexter {...props} />
                }}
              />
              <Route
                path="conversations"
                components={{
                  fullScreen: props => <ConversationTexter {...props} />
                }}
              />
            </Route>
          </Route>
        </Route>
      </Route>
      <Route path="login" component={Login} />
      <Route path="terms" component={Terms} />
      <Route path="reset/:resetHash" component={Home} onEnter={requireAuth} />
      <Route
        path="createOrganization"
        component={CreateOrganization}
        onEnter={requireAuth}
      />
      <Route
        path="join-campaign/:token"
        component={JoinCampaign}
        onEnter={requireAuth}
      />
      <Route path="*" component={() => <Error404 />} />
    </Route>
  );
}
