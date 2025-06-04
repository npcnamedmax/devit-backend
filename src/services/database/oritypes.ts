import type { UUID } from 'crypto';
import type {
    //ColumnType,
    Generated,
    Insertable,
    //JSONColumnType,
    Selectable,
    Updateable,
} from 'kysely';

export interface Database {
    User: UserTable;
    Post: PostTable;
    Comments: CommentTable;
    Resource: ResourceTable;
    Community: CommunityTable;
    UserPost: UserPostTable;
    UserComment: UserCommentTable;
    UserCommunity: UserCommunityTable;
}

export interface UserTable {
    id: Generated<string>;
    username: string;
    profile_url?: string;
    bio?: string;
    created_at: Date;
}

export type User = Selectable<UserTable>;
export type NewUser = Insertable<UserTable>;
export type UserUpdate = Updateable<UserTable>;

export interface PostTable {
    id: Generated<string>;
    title: string;
    description: string;
    created_at: Date;
    img_url?: string[];
    num_likes: number;
    num_comments: number;
    num_dislikes: number;
    author_id: UUID;
    community_id: UUID;
}

export type Post = Selectable<PostTable>;
export type NewPost = Insertable<PostTable>;
export type PostUpdate = Updateable<PostTable>;

export interface CommentTable {
    id: Generated<string>;
    post_id: UUID;
    author_id: UUID;
    created_at: Date;
    parent_id?: UUID;
    description: string;
    img_url?: string[];
    num_likes: number;
    num_dislikes: number;
}

export type Comment = Selectable<CommentTable>;
export type NewComment = Insertable<CommentTable>;
export type CommentUpdate = Updateable<CommentTable>;

export interface ResourceTable {
    id: Generated<UUID>;
    community_id: UUID;
    title: string;
    url: string;
}

export type Resource = Selectable<ResourceTable>;
export type NewResource = Insertable<ResourceTable>;
export type ResourceUpdate = Updateable<ResourceTable>;

export interface CommunityTable {
    id: Generated<string>;
    name: string;
    description: string;
    created_at: Date;
    banner_img_url?: string;
    profile_img_url?: string;
    rules?: string[];
}
export type Community = Selectable<CommunityTable>;
export type NewCommunity = Insertable<CommunityTable>;
export type CommunityUpdate = Updateable<CommunityTable>;

export interface UserPostTable {
    user_id: String;
    post_id: String;
    has_liked: boolean;
    has_disliked: boolean;
}
export type UserPost = Selectable<UserPostTable>;
export type NewUserPost = Insertable<UserPostTable>;
export type UserPostUpdate = Updateable<UserPostTable>;

export interface UserCommentTable {
    user_id: String;
    comment_id: String;
    has_liked: boolean;
    has_disliked: boolean;
}

export type UserComment = Selectable<UserCommentTable>;
export type NewUserComment = Insertable<UserCommentTable>;
export type UserCommentUpdate = Updateable<UserCommentTable>;

export interface UserCommunityTable {
    user_id: String;
    community_id: String;
    joined_at: Date;
    role: 'MODERATOR' | 'MEMBER';
}

export type UserCommunity = Selectable<UserCommunityTable>;
export type NewUserCommunity = Insertable<UserCommunityTable>;
export type UserCommunityUpdate = Updateable<UserCommunityTable>;
