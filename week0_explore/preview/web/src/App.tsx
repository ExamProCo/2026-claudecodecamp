import { BrowserRouter, Routes, Route } from "react-router";
import { WorldProvider } from "./data/useWorld";
import { ZoneScopeProvider } from "./data/zoneScope";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard";
import { Rooms } from "./pages/Rooms";
import { RoomDetail } from "./pages/RoomDetail";
import { Mobs } from "./pages/Mobs";
import { MobDetail } from "./pages/MobDetail";
import { Objects } from "./pages/Objects";
import { ObjectDetail } from "./pages/ObjectDetail";
import { Zones } from "./pages/Zones";
import { ZoneDetail } from "./pages/ZoneDetail";
import { Shops } from "./pages/Shops";
import { ShopDetail } from "./pages/ShopDetail";
import { Triggers } from "./pages/Triggers";
import { TriggerDetail } from "./pages/TriggerDetail";
import { Quests } from "./pages/Quests";
import { QuestDetail } from "./pages/QuestDetail";
import { MapView } from "./pages/MapView";
import { WorldMap } from "./pages/WorldMap";
import { NotFound } from "./pages/NotFound";

export default function App() {
  return (
    <WorldProvider>
      <BrowserRouter>
        <ZoneScopeProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="rooms" element={<Rooms />} />
              <Route path="rooms/:id" element={<RoomDetail />} />
              <Route path="mobs" element={<Mobs />} />
              <Route path="mobs/:id" element={<MobDetail />} />
              <Route path="objects" element={<Objects />} />
              <Route path="objects/:id" element={<ObjectDetail />} />
              <Route path="zones" element={<Zones />} />
              <Route path="zones/:id" element={<ZoneDetail />} />
              <Route path="shops" element={<Shops />} />
              <Route path="shops/:id" element={<ShopDetail />} />
              <Route path="triggers" element={<Triggers />} />
              <Route path="triggers/:id" element={<TriggerDetail />} />
              <Route path="quests" element={<Quests />} />
              <Route path="quests/:id" element={<QuestDetail />} />
              <Route path="map" element={<MapView />} />
              <Route path="world-map" element={<WorldMap />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </ZoneScopeProvider>
      </BrowserRouter>
    </WorldProvider>
  );
}
