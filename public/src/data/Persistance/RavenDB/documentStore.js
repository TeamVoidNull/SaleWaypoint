import { DocumentStore } from "ravendb";

const store = new DocumentStore("http://localhost:8080", "MyDistributedDB");
store.initialize();
export { store as documentStore }; 