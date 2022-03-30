-- CreateTable
CREATE TABLE "scrapping_links" (
    "id" SERIAL NOT NULL,
    "country" VARCHAR(50) NOT NULL,
    "country_short" VARCHAR(50) NOT NULL,
    "category" VARCHAR(50) NOT NULL,
    "category_short" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scrapping_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "story_ids" (
    "id" SERIAL NOT NULL,
    "country" VARCHAR(100) NOT NULL,
    "category" VARCHAR(100) NOT NULL,
    "story_id" VARCHAR(200) NOT NULL,
    "related_link" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "story_ids_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "story_data" (
    "id" SERIAL NOT NULL,
    "related_queries" TEXT NOT NULL,
    "related_articles" TEXT NOT NULL,
    "related_story_id" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "story_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "query_data" (
    "id" SERIAL NOT NULL,
    "query" TEXT NOT NULL,
    "links" TEXT NOT NULL,
    "related_story" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "query_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "website_data" (
    "id" SERIAL NOT NULL,
    "titles" TEXT NOT NULL,
    "descriptions" TEXT NOT NULL,
    "keywords" TEXT NOT NULL,
    "favicon" TEXT NOT NULL,
    "social" TEXT NOT NULL,
    "images" TEXT NOT NULL,
    "html" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "related_query_id" VARCHAR(255) NOT NULL,
    "all_images" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "website_data_pkey" PRIMARY KEY ("id")
);
