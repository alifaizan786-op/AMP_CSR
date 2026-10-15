import { Route, Routes } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import CustomerDetailPage from './pages/CustomerDetailPage';
import CustomerListPage from './pages/CustomerListPage';

const App = () => (
	<Routes>
		{/* Both pages render inside the shared layout */}
		<Route element={<AppLayout />}>
			<Route path='/' element={<CustomerListPage />} />
			<Route path='/customers/:id' element={<CustomerDetailPage />} />
		</Route>
	</Routes>
);

export default App;
