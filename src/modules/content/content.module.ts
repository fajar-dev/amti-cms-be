import { TypeOrmCategoryRepository } from "./repositories/category.repository"
import { TypeOrmArticleRepository } from "./repositories/article.repository"
import { TypeOrmArticleViewRepository } from "./repositories/article-view.repository"
import { CategoryService } from "./services/category.service"
import { ArticleService } from "./services/article.service"
import { CategoryController } from "./controllers/category.controller"
import { ArticleController } from "./controllers/article.controller"

export const categoryRepository = new TypeOrmCategoryRepository()
export const articleRepository = new TypeOrmArticleRepository()
export const articleViewRepository = new TypeOrmArticleViewRepository()

export const categoryService = new CategoryService(categoryRepository)
export const articleService = new ArticleService(
    articleRepository,
    categoryRepository,
    articleViewRepository
)

export const categoryController = new CategoryController(categoryService)
export const articleController = new ArticleController(articleService)
