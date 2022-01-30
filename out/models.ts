export interface User {
  /**
   * Unique identifier for the given user.
   */
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: string | null;
  /**
   * Set to true if the user's email has been verified.
   */
  emailVerified: boolean;
  /**
   * The date that the user was created.
   */
  createDate: string;
  [k: string]: unknown;
}

export interface Article {
  id: number;
  author: User;
  title: string;
  body: string;
  published: boolean;
  publishedAt: string;
  lastUpdatedAt: string;
  [k: string]: unknown;
}
