import { Request, Response } from "express";
import { AppError, asyncHandler, sendSuccess } from "../utils/http";
import {
  createPostWorkflow,
  deletePostWorkflow,
  getPostWorkflow,
  listPostWorkflow,
  listRecommendedPostsWorkflow,
  updatePostWorkflow
} from "../services/postService";
import { toUploadUrl } from "../config/multer";
import { createPostComment, listPostComments } from "../models/postCommentModel";
import { getPostById } from "../models/postModel";

function getUploadedImageUrls(request: Request): string[] {
  const files = request.files as
    | { [fieldname: string]: Express.Multer.File[] }
    | Express.Multer.File[]
    | undefined;

  if (!files) {
    return [];
  }

  const uploadedFiles = Array.isArray(files)
    ? files
    : [...(files.images ?? []), ...(files.image ?? [])];

  return uploadedFiles.slice(0, 4).map((file) => toUploadUrl(file.filename));
}

export const createPostController = asyncHandler(async (request: Request, response: Response) => {
  const imageUrls = getUploadedImageUrls(request);

  const postId = await createPostWorkflow({
    userId: request.user!.id,
    type: request.body.type,
    title: request.body.title,
    description: request.body.description,
    categoryId: request.body.categoryId,
    locationId: request.body.locationId,
    eventTime: request.body.eventTime,
    tags: request.body.tags ?? [],
    contactNote: request.body.contactNote,
    status: request.body.status,
    imageUrls
  });

  sendSuccess(response, "Post created and awaiting admin approval", { postId }, 201);
});

export const listPostsController = asyncHandler(async (request: Request, response: Response) => {
  const posts = await listPostWorkflow(
    request.query as any,
    request.user?.id,
    request.user?.role
  );
  sendSuccess(response, "Fetched posts", posts);
});

export const recommendedPostsController = asyncHandler(async (request: Request, response: Response) => {
  const parsedLimit = Number(request.query.limit ?? 8);
  const safeLimit = Number.isFinite(parsedLimit) ? parsedLimit : 8;

  const posts = await listRecommendedPostsWorkflow(request.user!.id, safeLimit);
  sendSuccess(response, "Fetched recommended posts", posts);
});

export const getPostController = asyncHandler(async (request: Request, response: Response) => {
  const postId = Number(request.params.id);
  const post = await getPostWorkflow(postId, request.user?.id, request.user?.role);
  sendSuccess(response, "Fetched post", post);
});

export const updatePostController = asyncHandler(async (request: Request, response: Response) => {
  const postId = Number(request.params.id);
  const imageUrls = getUploadedImageUrls(request);

  await updatePostWorkflow(
    postId,
    {
      ...request.body,
      imageUrls: imageUrls.length > 0 ? imageUrls : undefined
    },
    request.user!.id,
    request.user!.role
  );

  sendSuccess(response, "Post updated and sent for re-approval");
});

export const deletePostController = asyncHandler(async (request: Request, response: Response) => {
  const postId = Number(request.params.id);
  await deletePostWorkflow(postId, request.user!.id, request.user!.role);
  sendSuccess(response, "Post deleted");
});

export const listPostCommentsController = asyncHandler(async (request: Request, response: Response) => {
  const postId = Number(request.params.id);
  const post = await getPostById(postId);
  if (!post) {
    throw new AppError(404, "Post not found");
  }

  const rows = await listPostComments(postId);

  const comments = rows.map((row) => ({
    id: row.id,
    postId: row.post_id,
    userId: row.user_id,
    content: row.content,
    createdAt: row.created_at,
    author: {
      fullName: row.full_name,
      avatarUrl: row.avatar_url
    }
  }));

  sendSuccess(response, "Fetched post comments", comments);
});

export const createPostCommentController = asyncHandler(async (request: Request, response: Response) => {
  const postId = Number(request.params.id);
  const post = await getPostById(postId);
  if (!post) {
    throw new AppError(404, "Post not found");
  }

  const commentId = await createPostComment(postId, request.user!.id, request.body.content);
  sendSuccess(response, "Comment posted", { commentId }, 201);
});
