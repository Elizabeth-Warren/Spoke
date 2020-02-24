import { IndexRoute, IndexRedirect, Route } from "react-router";
import React from "react";

const App = React.lazy(() => import("./components/App"));
const AdminDashboard = React.lazy(() => import("./components/AdminDashboard"));
const AdminCampaignList = React.lazy(() =>
  import("./containers/AdminCampaignList")
);
const AdminCampaignStats = React.lazy(() =>
  import("./containers/AdminCampaignStats")
);
const AdminPersonList = React.lazy(() =>
  import("./containers/AdminPersonList")
);
const AdminIncomingMessageList = React.lazy(() =>
  import("./containers/AdminIncomingMessageList")
);
const AdminCampaignEdit = React.lazy(() =>
  import("./containers/AdminCampaignEdit")
);
const TexterDashboard = React.lazy(() =>
  import("./components/TexterDashboard")
);
const TopNav = React.lazy(() => import("./components/TopNav"));
const DashboardLoader = React.lazy(() =>
  import("./containers/DashboardLoader")
);
const TexterTodoList = React.lazy(() => import("./containers/TexterTodoList"));
const ConversationTexter = React.lazy(() =>
  import("./containers/ConversationTexter")
);
const SuspendedTexter = React.lazy(() =>
  import("./containers/SuspendedTexter")
);
const Login = React.lazy(() => import("./components/Login"));
const Terms = React.lazy(() => import("./containers/Terms"));
const CreateOrganization = React.lazy(() =>
  import("./containers/CreateOrganization")
);
const JoinCampaign = React.lazy(() => import("./containers/JoinCampaign"));
const Home = React.lazy(() => import("./containers/Home"));
const Settings = React.lazy(() => import("./containers/Settings"));
const UserEdit = React.lazy(() => import("./containers/UserEdit"));
const TexterFaqs = React.lazy(() =>
  import("./components/TexterFrequentlyAskedQuestions")
);
const FAQs = React.lazy(() => import("./lib/faqs"));
const AdminCampaignCreate = React.lazy(() =>
  import("./containers/AdminCampaignCreate")
);
const InitialMessageTexter = React.lazy(() =>
  import("src/containers/AssignmentTexter/InitialMessageTexter")
);
const SingleAssignmentSummary = React.lazy(() =>
  import("./containers/SingleAssignmentSummary")
);

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
      <Route path="*" component={() => <p>Not Found</p>} />
    </Route>
  );
}
