"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

type Comment = {
    id: string;
    content: string;
    created_at: string;
    parent_id?: string | null;
    is_virtual?: boolean;
    has_real_reply?: boolean;
    commenter?: { id: string; full_name?: string | null } | null;
    virtual_commenter_id?: string | null;
    replies?: Comment[];
};

type Props = {
    comments: Comment[];
    profileUserId: string;
    currentUserId: string | null;
    isOwnProfile: boolean;
};

// 將留言整理成討論串結構
function organizeComments(comments: Comment[]): Comment[] {
    const commentMap = new Map<string, Comment>();
    const rootComments: Comment[] = [];

    // 建立 map
    comments.forEach((comment) => {
        commentMap.set(comment.id, { ...comment, replies: [] });
    });

    // 整理成樹狀結構
    comments.forEach((comment) => {
        const mappedComment = commentMap.get(comment.id)!;
        if (comment.parent_id && commentMap.has(comment.parent_id)) {
            commentMap.get(comment.parent_id)!.replies!.push(mappedComment);
        } else {
            rootComments.push(mappedComment);
        }
    });

    return rootComments;
}

// 單一留言項目
function CommentItem({
    comment,
    profileUserId,
    currentUserId,
    isOwnProfile,
    depth = 0,
    onReply,
}: {
    comment: Comment;
    profileUserId: string;
    currentUserId: string | null;
    isOwnProfile: boolean;
    depth?: number;
    onReply: (parentId: string) => void;
}) {
    const router = useRouter();
    const isVirtual = comment.is_virtual || !comment.commenter;
    const canDelete = !isVirtual && (currentUserId === comment.commenter?.id || isOwnProfile);

    const handleDelete = async () => {
        await supabase.from("profile_comments").delete().eq("id", comment.id);
        router.refresh();
    };

    return (
        <div className={`${depth > 0 ? "ml-8 border-l-2 border-white/10 pl-4" : ""}`}>
            <div className="flex gap-3 rounded-lg bg-white/5 p-3">
                {/* 頭像 */}
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-purple-500 text-sm font-bold text-white">
                    {(comment.commenter?.full_name || "匿").slice(0, 1).toUpperCase()}
                </div>
                {/* 內容 */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-white truncate">
                            {comment.commenter?.full_name || "匿名"}
                        </span>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-white/40 shrink-0">
                                {new Date(comment.created_at).toLocaleDateString("zh-TW")}
                            </span>
                            {canDelete && (
                                <button
                                    onClick={handleDelete}
                                    className="text-red-400/60 hover:text-red-400 text-xs"
                                    title="刪除留言"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    </div>
                    <p className="mt-1 text-sm text-white/80 break-words">{comment.content}</p>
                    {/* 回覆按鈕 */}
                    {currentUserId && depth < 2 && (
                        <button
                            onClick={() => onReply(comment.id)}
                            className="mt-2 text-xs text-blue-300/60 hover:text-blue-300"
                        >
                            ↳ 回覆
                        </button>
                    )}
                </div>
            </div>

            {/* 子留言 */}
            {comment.replies && comment.replies.length > 0 && (
                <div className="mt-2 space-y-2">
                    {comment.replies.map((reply) => (
                        <CommentItem
                            key={reply.id}
                            comment={reply}
                            profileUserId={profileUserId}
                            currentUserId={currentUserId}
                            isOwnProfile={isOwnProfile}
                            depth={depth + 1}
                            onReply={onReply}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function CommentThread({ comments, profileUserId, currentUserId, isOwnProfile }: Props) {
    const router = useRouter();
    const [newComment, setNewComment] = useState("");
    const [replyTo, setReplyTo] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const organizedComments = organizeComments(comments);

    const handleSubmit = async () => {
        if (!newComment.trim() || !currentUserId) return;
        setIsSubmitting(true);

        // 檢查 replyTo 是否為有效 UUID（虛擬留言 ID 格式是 virtual-comment-xxx，不是 UUID）
        const isValidUUID = replyTo && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(replyTo);
        const parentId = isValidUUID ? replyTo : null;

        const { error } = await supabase.from("profile_comments").insert({
            profile_user_id: profileUserId,
            commenter_id: currentUserId,
            content: newComment.trim(),
            parent_id: parentId,
        });

        if (error) {
            console.error("Comment insert error:", error);
            alert(`留言失敗: ${error.message}`);
        } else {
            setNewComment("");
            setReplyTo(null);
            router.refresh();
        }
        setIsSubmitting(false);
    };

    const handleReply = (parentId: string) => {
        setReplyTo(parentId);
        // 找到父留言的用戶名
        const parentComment = comments.find((c) => c.id === parentId);
        if (parentComment) {
            setNewComment(`@${parentComment.commenter?.full_name || "匿名"} `);
        }
    };

    const cancelReply = () => {
        setReplyTo(null);
        setNewComment("");
    };

    return (
        <section className="glass-card p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">💬 留言區</h2>

            {/* 留言輸入 */}
            <div className="mb-4">
                {replyTo && (
                    <div className="mb-2 flex items-center gap-2 text-sm text-blue-300">
                        <span>↳ 回覆中</span>
                        <button onClick={cancelReply} className="text-white/40 hover:text-white">
                            ✕ 取消
                        </button>
                    </div>
                )}
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder={replyTo ? "輸入回覆內容..." : "留下一則訊息..."}
                        className="flex-1 rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none"
                        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                    />
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !newComment.trim()}
                        className="rounded-lg bg-blue-500/20 px-4 py-2 text-sm text-blue-200 transition hover:bg-blue-500/30 disabled:opacity-50"
                    >
                        {replyTo ? "回覆" : "發送"}
                    </button>
                </div>
            </div>

            {/* 留言列表 */}
            {organizedComments.length > 0 ? (
                <div className="space-y-3">
                    {organizedComments.map((comment) => (
                        <CommentItem
                            key={comment.id}
                            comment={comment}
                            profileUserId={profileUserId}
                            currentUserId={currentUserId}
                            isOwnProfile={isOwnProfile}
                            onReply={handleReply}
                        />
                    ))}
                </div>
            ) : (
                <p className="text-center text-white/50">還沒有留言，成為第一個留言的人吧！</p>
            )}
        </section>
    );
}
