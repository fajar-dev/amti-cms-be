import { ArticleView } from "../entities/article-view.entity"

export class ArticleViewSerializer {
    static single(view: ArticleView) {
        return {
            id: view.id,
            articleId: view.articleId,
            ipAddress: view.ipAddress || null,
            userAgent: view.userAgent || null,
            referrer: view.referrer || null,
            userId: view.userId || null,
            viewedAt: view.viewedAt,
        }
    }

    static collection(views: ArticleView[]) {
        return views.map((v) => this.single(v))
    }
}
