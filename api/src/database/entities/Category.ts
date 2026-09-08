import { Entity, Column, ManyToOne, OneToMany, JoinColumn, Unique, type Relation } from "typeorm";
import { AppBaseEntity } from "./BaseEntity";
import { Election } from "./Election";
import { Nominee } from "./Nominee";

@Entity("categories")
@Unique(["name", "election"])
export class Category extends AppBaseEntity {
  @ManyToOne(() => Election, (election) => election.categories, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "election_id" })
  election!: Relation<Election>;

  @Column({type: "varchar", length: 255, nullable: false })
  name!: string;

  @Column({ type: "text", nullable: true })
  description?: string;

  @Column({ name: "display_order", type: "int", default: 0 })
  displayOrder!: number;

  @OneToMany(() => Nominee, (nominee) => nominee.category)
  nominees!: Relation<Nominee[]>;
}