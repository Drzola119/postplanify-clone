// Calendar has its own public route. Re-exporting the existing implementation
// keeps legacy /dashboard/posts links compatible while separating the URL and
// sidebar active state from /dashboard/posts/create.
export { default } from "../posts/page";
