import { Entity, Column, ManyToOne, JoinColumn, type Relation } from "typeorm";
import { AppBaseEntity } from "./BaseEntity";
import { Election } from "./Election";
import { Category } from "./Category";
import { Nominee } from "./Nominee";
import { Payment } from "./Payment";

@Entity("votes")
export class Vote extends AppBaseEntity {
  @ManyToOne(() => Election, { onDelete: "CASCADE" })
  @JoinColumn({ name: "election_id" })
  election!: Relation<Election>;

  @ManyToOne(() => Category, { onDelete: "CASCADE" })
  @JoinColumn({ name: "category_id" })
  category!: Relation<Category>;

  @ManyToOne(() => Nominee, (nominee) => nominee.votes, { onDelete: "CASCADE" })
  @JoinColumn({ name: "nominee_id" })
  nominee!: Relation<Nominee>;

  @Column({ name: "voter_email", nullable: true })
  voterEmail?: string;

  @Column({ name: "voter_phone", nullable: true })
  voterPhone?: string;

  @ManyToOne(() => Payment, (payment) => payment.votes, { nullable: true })
  @JoinColumn({ name: "payment_id" })
  payment?: Relation<Payment>;

  @Column({ type: "int", default: 1 })
  quantity!: number;
}