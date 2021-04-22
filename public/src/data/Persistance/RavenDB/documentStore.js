import { DocumentStore } from "ravendb";

const store = new DocumentStore("http://137.112.89.84:8080", "MyDistrubutedDB");
store.initialize();
export { store as documentStore }; 