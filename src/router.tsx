import { createRouter, createRoute, createRootRoute, Outlet } from '@tanstack/react-router'
import RootLayout from './components/layout/RootLayout'
import Landing from './pages/Landing'
import Live from './pages/Live'
import Workspace from './pages/Workspace'
import Learn from './pages/Learn'
import Play from './pages/Play'
import Canvas from './pages/Canvas'

const rootRoute = createRootRoute({ component: () => <Outlet /> })

const layoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'layout',
  component: () => <RootLayout><Outlet /></RootLayout>,
})

const indexRoute = createRoute({ getParentRoute: () => layoutRoute, path: '/', component: Landing })
const liveRoute = createRoute({ getParentRoute: () => layoutRoute, path: '/live', component: Live })
const learnRoute = createRoute({ getParentRoute: () => layoutRoute, path: '/learn', component: Learn })
const playRoute = createRoute({ getParentRoute: () => layoutRoute, path: '/play', component: Play })

// Full-screen — NO layout wrapper
const workspaceRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/live/$roomId',
  component: Workspace,
})

const canvasRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/canvas',
  component: Canvas,
})

const routeTree = rootRoute.addChildren([
  layoutRoute.addChildren([indexRoute, liveRoute, learnRoute, playRoute]),
  workspaceRoute,
  canvasRoute,
])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register { router: typeof router }
}
