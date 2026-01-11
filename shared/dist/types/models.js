export var ProjectStatus;
(function (ProjectStatus) {
    ProjectStatus["DRAFT"] = "DRAFT";
    ProjectStatus["PUBLISHED"] = "PUBLISHED";
    ProjectStatus["ARCHIVED"] = "ARCHIVED";
})(ProjectStatus || (ProjectStatus = {}));
export var ArticleStatus;
(function (ArticleStatus) {
    ArticleStatus["DRAFT"] = "DRAFT";
    ArticleStatus["PUBLISHED"] = "PUBLISHED";
    ArticleStatus["ARCHIVED"] = "ARCHIVED";
})(ArticleStatus || (ArticleStatus = {}));
export var UserRole;
(function (UserRole) {
    UserRole["VIEWER"] = "VIEWER";
    UserRole["EDITOR"] = "EDITOR";
    UserRole["ADMIN"] = "ADMIN";
})(UserRole || (UserRole = {}));
export var EventType;
(function (EventType) {
    EventType["PAGE_VIEW"] = "PAGE_VIEW";
    EventType["PROJECT_VIEW"] = "PROJECT_VIEW";
    EventType["ARTICLE_VIEW"] = "ARTICLE_VIEW";
    EventType["LIKE"] = "LIKE";
    EventType["SHARE"] = "SHARE";
    EventType["CONTACT_SUBMIT"] = "CONTACT_SUBMIT";
    EventType["NEWSLETTER_SUBSCRIBE"] = "NEWSLETTER_SUBSCRIBE";
    EventType["DOWNLOAD"] = "DOWNLOAD";
    EventType["EXTERNAL_LINK_CLICK"] = "EXTERNAL_LINK_CLICK";
})(EventType || (EventType = {}));
//# sourceMappingURL=models.js.map