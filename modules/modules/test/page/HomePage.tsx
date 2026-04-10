import { NavTo } from "/modules/stdlib/src/webpack/ReactComponents.ts";

export const HomePage = () => {
	return (
		<div>
			<h1>Home Page</h1>
			<p>Welcome to the Home Page!</p>
			<NavTo to="/test/TestPage1" replace={true}>
				Go to Component Page
			</NavTo>
		</div>
	);
};
