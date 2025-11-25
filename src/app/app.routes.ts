import { Routes } from "@angular/router";
import { LandingComponent } from "./features/landing/landing";
import { NotFoundComponent } from "./features/not-found/not-found";
import { DocsShellComponent } from "./shared/layouts/docs-layout/docs.layout";
import { SettingsShellComponent } from "./shared/layouts/settings-layout/settings.layout";
import { TaskLayoutComponent } from "./shared/layouts/task-layout/task.layout";
import { TaskDashboardComponent } from "./features/tasks/pages/task-dashboard/task-dashboard";
import { TaskListComponent } from "./features/tasks/pages/task-list/task-list";
import { ReleasesPageComponent } from "./features/tasks/pages/releases/releases";
import { DOCS_ROUTES } from "./features/docs/docs.routes";
import { SETTINGS_ROUTES } from "./features/settings/settings.routes";

export const routes: Routes = [
  { path: "", redirectTo: "/landing", pathMatch: "full" },
  { path: "landing", component: LandingComponent },
  {
    path: "docs",
    component: DocsShellComponent,
    children: DOCS_ROUTES,
  },
  {
    path: "settings",
    component: SettingsShellComponent,
    children: SETTINGS_ROUTES,
  },
  {
    path: "tasks",
    component: TaskLayoutComponent,
    children: [
      { path: "", redirectTo: "board", pathMatch: "full" },
      { path: "board", component: TaskDashboardComponent },
      { path: "list", component: TaskListComponent },
      { path: "releases", component: ReleasesPageComponent }
    ]
  },
  { path: "**", component: NotFoundComponent },
];
