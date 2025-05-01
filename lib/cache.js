// 简单的LRU缓存实现
class LRUCache {
  constructor(maxSize = 512) {
    this.maxSize = maxSize;
    this.cache = new Map();
  }

  get(key) {
    if (!this.cache.has(key)) return null;

    // 访问时将项目移到最近使用
    const value = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  set(key, value) {
    // 如果键已存在，先删除它
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    // 添加到缓存
    this.cache.set(key, value);

    // 如果超出大小限制，删除最老的项目
    if (this.cache.size > this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
  }

  delete(key) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }
}

// 全局缓存，用于存储书籍列表和单个书籍详情
class BookCache {
  constructor() {
    // 列表缓存（按状态和游标）
    this.listCache = new Map();

    // 书籍详情的LRU缓存
    this.bookDetailsCache = new LRUCache(512);

    // 缓存过期时间（30分钟）
    this.expiryTime = 30 * 60 * 1000;
  }

  // 获取列表缓存
  getList(status, pageSize, cursor) {
    const key = this._getListKey(status, pageSize, cursor);
    const cached = this.listCache.get(key);

    if (cached && Date.now() - cached.timestamp < this.expiryTime) {
      return cached.data;
    }

    return null;
  }

  // 设置列表缓存
  setList(status, pageSize, cursor, data) {
    const key = this._getListKey(status, pageSize, cursor);
    this.listCache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  // 获取书籍详情缓存
  getBookDetails(pageId) {
    return this.bookDetailsCache.get(pageId);
  }

  // 设置书籍详情缓存
  setBookDetails(pageId, data) {
    this.bookDetailsCache.set(pageId, {
      data,
      timestamp: Date.now()
    });
  }

  // 清除所有缓存
  clearAll() {
    this.listCache.clear();
    this.bookDetailsCache.clear();
  }

  // 清除特定状态的列表缓存
  clearListCache(status) {
    for (const key of this.listCache.keys()) {
      if (key.startsWith(`list:${status}:`)) {
        this.listCache.delete(key);
      }
    }
  }

  // 生成列表缓存键
  _getListKey(status, pageSize, cursor) {
    return `list:${status}:${pageSize}:${cursor || 'start'}`;
  }
}

// 导出单例实例
const bookCache = new BookCache();
export default bookCache;