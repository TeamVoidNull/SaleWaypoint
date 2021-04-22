import { DocumentStore } from "ravendb";

const store = new DocumentStore(
    ["http://137.112.89.84:8080/"],   // URL to the Server
                                        // or list of URLs
                                        // to all Cluster Servers (Nodes)

    "MyDistributedDB");                       // Default database that DocumentStore will interact with

const conventions = store.conventions;  // DocumentStore customizations

store.initialize();                     // Each DocumentStore needs to be initialized before use.
                                        // This process establishes the connection with the Server
                                        // and downloads various configurations
                                        // e.g. cluster topology or client configuration

store.dispose();                  // Dispose the resources claimed by the DocumentStore

const session = store.openSession();                // Open a session for a default 'Database'

const category = new Category("Database Category");

await session.store(category);                      // Assign an 'Id' and collection (Categories)
                                                    // and start tracking an entity

const game = new Game(
    "RavenDB Database",
    category.Id, 
    10);

await session.store(product);                       // Assign an 'Id' and collection (Products)
                                                    // and start tracking an entity

await session.saveChanges();                        // Send to the Server
                                                    // one request processed in one transaction