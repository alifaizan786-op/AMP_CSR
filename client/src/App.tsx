import { lazy } from 'react';
import { Route, Routes } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import NotFoundPage from './pages/NotFoundPage';
// Each page becomes its own file that downloads the first time the route is visited
const CustomerListPage = lazy(() => import('./pages/CustomerListPage'));
const CustomerDetailPage = lazy(() => import('./pages/CustomerDetailPage'));

const App = () => (
	<Routes>
		{/* Both pages render inside the shared layout */}
		<Route element={<AppLayout />}>
			<Route path='/' element={<CustomerListPage />} />
			<Route path='/customers/:id' element={<CustomerDetailPage />} />
			{/* Anything else, e.g. a mistyped URL */}
			<Route path='*' element={<NotFoundPage />} />
		</Route>
	</Routes>
);

export default App;
