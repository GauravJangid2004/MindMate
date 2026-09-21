import { createBrowserRouter } from "react-router";
import { Root } from "./components/Root";
import { Home } from "./pages/Home";
import { Connect } from "./pages/Connect";
import { WellnessHub } from "./pages/WellnessHub";
import { MoodTracker } from "./pages/MoodTracker";
import { Community } from "./pages/Community";
import { Safety } from "./pages/Safety";
import { Profile } from "./pages/Profile";
import { Chat } from "./pages/Chat";
import { AskSenior } from "./pages/AskSenior";
import { SilentSupport } from "./pages/SilentSupport";
import { BreathingExercise } from "./pages/BreathingExercise";
import { Login } from "./pages/Login";
import { VerifyIdentity } from "./pages/VerifyIdentity";
import { SignupStudent } from "./pages/SignupStudent";
import { SignupElder } from "./pages/SignupElder";
import { SelectMentor } from "./pages/SelectMentor";
import { ConnectionRequests } from "./pages/ConnectionRequests";
import { QRConnection } from "./pages/QRConnection";
import { Diary } from "./pages/Diary";
import { StudentDiary } from "./pages/StudentDiary";

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/verify",
    Component: VerifyIdentity,
  },
  {
    path: "/signup/student",
    Component: SignupStudent,
  },
  {
    path: "/signup/elder",
    Component: SignupElder,
  },
  {
    path: "/select-mentor",
    Component: SelectMentor,
  },
  {
    path: "/requests",
    Component: ConnectionRequests,
  },
  {
    path: "/qr-connection",
    Component: QRConnection,
  },
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: Home },
      { path: "connect", Component: Connect },
      { path: "diary/:studentId", Component: StudentDiary },
      { path: "diary", Component: Diary },
      { path: "student-diary", Component: StudentDiary },
      { path: "wellness", Component: WellnessHub },
      { path: "mood-tracker", Component: MoodTracker },
      { path: "community", Component: Community },
      { path: "safety", Component: Safety },
      { path: "profile", Component: Profile },
      { path: "chat/:id", Component: Chat },
      { path: "ask-senior", Component: AskSenior },
      { path: "silent-support", Component: SilentSupport },
      { path: "breathing", Component: BreathingExercise },
    ],
  },
]);