import "reflect-metadata";
import { DataSource } from "typeorm";

// Entities — explicit imports required here (not glob).
// Next.js bundles this file for API routes; a runtime glob can't be
// statically traced by the bundler and silently finds nothing.
import { User } from "./entities/User";
import { Category } from "./entities/Category";
import { AuditLog } from "./entities/AuditLog";
import { Election } from "./entities/Election";
import { Nominee } from "./entities/Nominee";
import { Payment } from "./entities/Payment";
import { Vote } from "./entities/Vote";

let dataSource: DataSource | null = null;

export const AppDataSource = async () => {
  if (dataSource && dataSource.isInitialized) {
    return dataSource;
  }

  dataSource = new DataSource({
    type: "postgres",
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    synchronize: false,
    logging: process.env.NODE_ENV === "development",
    entities: [
      AuditLog,
      Category,
      Election,
      Nominee,
      Payment,
      User,
      Vote,
    ],
  });

  if (!dataSource.isInitialized) {
    await dataSource.initialize();
  }

  return dataSource;
};


//Production
// import "reflect-metadata";
// import { DataSource } from "typeorm";
// import { User } from "./entities/User";
// import { Category } from "./entities/Category";

// let dataSource: DataSource | null = null;

// export const AppDataSource = async () => {
//   if (dataSource && dataSource.isInitialized) {
//     return dataSource;
//   }

//   dataSource = new DataSource({
//     type: "postgres",
//     url: process.env.DATABASE_URL,
//     ssl: { rejectUnauthorized: false },
//     synchronize: false,
//     logging: process.env.NODE_ENV === "development",
//     entities: [User, Category],
//   });

//   if (!dataSource.isInitialized) {
//     await dataSource.initialize();
//   }

//   return dataSource;
// };