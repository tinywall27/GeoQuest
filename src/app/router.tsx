import { createBrowserRouter } from "react-router-dom";
import { AppShell } from "./AppShell";
import { ExperienceModeProvider } from "./ExperienceMode";
import { ChannelPage } from "../pages/ChannelPage";
import { ClassroomGuidePage } from "../pages/ClassroomGuidePage";
import { HomePage } from "../pages/HomePage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { SettingsPage } from "../pages/SettingsPage";
import { SourcesPage } from "../pages/SourcesPage";
import { TextbooksPage } from "../pages/TextbooksPage";
import { TopicPage } from "../pages/TopicPage";
import { TopicsPage } from "../pages/TopicsPage";
import { VolumePage } from "../pages/VolumePage";

export const router = createBrowserRouter([
  {
    element: (
      <ExperienceModeProvider>
        <AppShell />
      </ExperienceModeProvider>
    ),
    children: [
      { index: true, element: <HomePage /> },
      { path: "textbooks", element: <TextbooksPage /> },
      { path: "textbooks/:volume", element: <VolumePage /> },
      { path: "topics", element: <TopicsPage /> },
      { path: "topics/:slug", element: <TopicPage /> },
      { path: "labs/maps", element: <ChannelPage channel="map-lab" /> },
      { path: "labs/data", element: <ChannelPage channel="data-lab" /> },
      { path: "labs/earth", element: <ChannelPage channel="earth-lab" /> },
      { path: "regions", element: <ChannelPage channel="region-explorer" /> },
      { path: "challenges", element: <ChannelPage channel="geo-challenge" /> },
      { path: "classroom", element: <ClassroomGuidePage /> },
      { path: "sources", element: <SourcesPage /> },
      { path: "settings", element: <SettingsPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
], { basename: import.meta.env.BASE_URL });
