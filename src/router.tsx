import { createRouter, createRoute, createRootRoute, Outlet } from '@tanstack/react-router'
import RootLayout from './components/layout/RootLayout'
import Landing from './pages/Landing'
import Live from './pages/Live'
import LiveRoom from './pages/LiveRoom'
import Learn from './pages/Learn'
import Play from './pages/Play'

const rootRoute = createRootRoute({
  component: () => (
    <RootLayout>
      <Outlet />
    </RootLayout>
  ),
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: Landing,
})

const liveRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/live',
  component: Live,
})

const liveRoomRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/live/$roomId',
  component: LiveRoom,
})

const learnRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/learn',
  component: Learn,
})

const playRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/play',
  component: Play,
})

const routeTree = rootRoute.addChildren([
  indexRoute,
  liveRoute,
  liveRoomRoute,
  learnRoute,
  playRoute,
])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
