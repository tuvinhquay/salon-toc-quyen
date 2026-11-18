import { createRootRoute, createRoute, createRouter } from '@tanstack/react-router'
import { DashboardPage, ModulePage, RootLayout } from './App'
import { navigation } from './navigation'

const rootRoute = createRootRoute({ component: RootLayout })
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: DashboardPage,
})
const moduleRoutes = navigation
  .filter((item) => item.to !== '/')
  .map((item) => createRoute({
    getParentRoute: () => rootRoute,
    path: item.to,
    component: () => <ModulePage item={item} />,
  }))

const routeTree = rootRoute.addChildren([indexRoute, ...moduleRoutes])

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
