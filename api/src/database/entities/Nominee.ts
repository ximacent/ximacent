import { Entity, Column, ManyToOne, OneToMany, JoinColumn, type Relation } from "typeorm";
import { AppBaseEntity } from "./BaseEntity";
import { Category } from "./Category";
import { Vote } from "./Vote";

@Entity("nominees")
export class Nominee extends AppBaseEntity {
  @ManyToOne(() => Category, (category) => category.nominees, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "category_id" })
  category!: Relation<Category>;

  @Column({type: "varchar", length: 255, nullable: false })
  name!: string;

  @Column({ type: "text", nullable: true })
  bio?: string;

  @Column({ name: "image_url", nullable: true })
  imageUrl?: string;

  @Column({ unique: true, type: "varchar", length: 20, nullable: false })
  code!: string;

  @OneToMany(() => Vote, (vote) => vote.nominee)
  votes!: Relation<Vote[]>;
}