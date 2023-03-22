export type Nullable<T> = T | null

export type SingleOrArray<T> = T | T[]

export type SyncOrAsyncValue<T = void> = T | Promise<T>

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface OpaqueIndex {}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface OpaqueDocumentStore {}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Schema extends Record<string, SearchableType | Schema> {}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Document extends Record<string, SearchableValue | Document | unknown> {}

export type SearchableType = 'string' | 'number' | 'boolean'

export type SearchableValue = string | number | boolean

export type BM25Params = {
  k?: number
  b?: number
  d?: number
}

export type FacetSorting = 'asc' | 'desc' | 'ASC' | 'DESC'

export interface StringFacetDefinition {
  limit?: number
  offset?: number
  sort?: FacetSorting
}

export interface NumberFacetDefinition {
  ranges: { from: number; to: number }[]
}

export interface BooleanFacetDefinition {
  true?: boolean
  false?: boolean
}

export type FacetDefinition = StringFacetDefinition | NumberFacetDefinition | BooleanFacetDefinition

export type ComparisonOperator = {
  gt?: number
  gte?: number
  lt?: number
  lte?: number
  eq?: number
  between?: [number, number]
}

export type SearchParams = {
  /**
   * The word to search.
   */
  term: string
  /**
   * The properties of the document to search in.
   */
  properties?: '*' | string[]
  /**
   * The number of matched documents to return.
   */
  limit?: number
  /**
   * The number of matched documents to skip.
   */
  offset?: number
  /**
   * Whether to match the term exactly.
   */
  exact?: boolean
  /**
   * The maximum [levenshtein distance](https://en.wikipedia.org/wiki/Levenshtein_distance)
   * between the term and the searchable property.
   */
  tolerance?: number
  /**
   * The BM25 parameters to use.
   *
   * k: Term frequency saturation parameter.
   * The higher the value, the more important the term frequency becomes.
   * The default value is 1.2. It should be set to a value between 1.2 and 2.0.
   *
   * b: Document length saturation impact. The higher the value, the more
   * important the document length becomes. The default value is 0.75.
   *
   * d: Frequency normalization lower bound. Default value is 0.5.
   *
   * @see https://en.wikipedia.org/wiki/Okapi_BM25
   */
  relevance?: BM25Params
  /**
   * The boost to apply to the properties.
   *
   * The boost is a number that is multiplied to the score of the property.
   * It can be used to give more importance to some properties.
   *
   * @example
   * // Give more importance to the 'title' property.
   * const result = await search(db, {
   *  term: 'Michael',
   *  properties: ['title', 'author'],
   *  boost: {
   *   title: 2
   *  }
   * });
   *
   * // In that case, the score of the 'title' property will be multiplied by 2.
   */
  boost?: Record<string, number>
  /**
   * Facets configuration
   *
   * A facet is a feature that allows users to narrow down their search results by specific
   * attributes or characteristics, such as category, price, or location.
   * This can help users find more relevant and specific results for their search query.
   *
   * @example
   *
   * const results = await search(db, {
   *  term: 'Personal Computer',
   *  properties: ['title', 'description', 'category.primary', 'category.secondary'],
   *  facets: {
   *    'category.primary': {
   *      size: 10,
   *      sort: 'ASC',
   *    }
   *  }
   * });
   */
  facets?: Record<string, FacetDefinition>

  /**
   * Filter the search results.
   *
   * @example
   * // Search for documents that contain 'Headphones' in the 'description' and 'title' fields and
   * // have a price less than 100.
   *
   * const result = await search(db, {
   *  term: 'Headphones',
   *  properties: ['description', 'title'],
   *  where: {
   *    price: {
   *      lt: 100
   *    }
   *  }
   * });
   */
  where?: Record<string, boolean | ComparisonOperator>
}

export type Result = {
  /**
   * The id of the document.
   */
  id: string
  /**
   * The score of the document in the search.
   */
  score: number
  /**
   * The document
   */
  document: Document
}

export type FacetResult = Record<
  string,
  {
    count: number
    values: Record<string, number>
  }
>

export type TokenScore = [string, number]

export type TokenMap = Record<string, TokenScore[]>

export type IndexMap = Record<string, TokenMap>

export type SearchContext = {
  timeStart: bigint
  params: SearchParams
  docsCount: number
  uniqueDocsIDs: Record<string, number>
  indexMap: IndexMap
  docsIntersection: TokenMap
}

export type ElapsedTime = {
  raw: number
  formatted: string
}

export type Results = {
  /**
   * The number of all the matched documents.
   */
  count: number
  /**
   * An array of matched documents taking `limit` and `offset` into account.
   */
  hits: Result[]
  /**
   * The time taken to search.
   */
  elapsed: ElapsedTime
  /**
   * The facets results.
   */
  facets?: FacetResult
}

export type SingleCallbackComponent = (orama: Orama, id: string, doc?: Document) => SyncOrAsyncValue

export type MultipleCallbackComponent = (orama: Orama, doc: Document[] | string[]) => SyncOrAsyncValue

export type IIndexInsertOrRemoveFunction<I extends OpaqueIndex = OpaqueIndex, R = void> = (
  index: I,
  id: string,
  prop: string,
  value: SearchableValue,
  language: string | undefined,
  tokenizer: Tokenizer,
  docsCount: number,
) => SyncOrAsyncValue<R>

export type IIndexRemoveFunction<I extends OpaqueIndex = OpaqueIndex> = (
  index: I,
  id: string,
  prop: string,
) => SyncOrAsyncValue

export interface IIndex<I extends OpaqueIndex = OpaqueIndex> {
  create: (orama: Orama<{ Index: I }>, schema: Schema) => I

  beforeInsert?: IIndexInsertOrRemoveFunction<I>
  insert: IIndexInsertOrRemoveFunction<I>
  afterInsert?: IIndexInsertOrRemoveFunction<I>

  beforeRemove?: IIndexInsertOrRemoveFunction<I>
  remove: IIndexInsertOrRemoveFunction<I, boolean>
  afterRemove?: IIndexInsertOrRemoveFunction<I>

  search(index: I, prop: string, terms: string, context: SearchContext): SyncOrAsyncValue<TokenScore[]>
  searchByWhereClause(index: I, filters: Record<string, boolean | ComparisonOperator>): string[]

  getSearchableProperties(index: I): SyncOrAsyncValue<string[]>
  getSearchablePropertiesWithTypes(index: I): SyncOrAsyncValue<Record<string, SearchableType>>

  load<R = unknown>(raw: R): I | Promise<I>
  save<R = unknown>(index: I): R | Promise<R>
}

export interface IDocumentsStore<D extends OpaqueDocumentStore = OpaqueDocumentStore> {
  create: (orama: Orama<{ DocumentStore: D }>) => D
  get(store: D, id: string): SyncOrAsyncValue<Document | undefined>
  getMultiple(store: D, ids: string[]): SyncOrAsyncValue<(Document | undefined)[]>
  store(store: D, id: string, doc: Document): SyncOrAsyncValue<boolean>
  remove(store: D, id: string): SyncOrAsyncValue<boolean>
  count(store: D): SyncOrAsyncValue<number>

  load<R = unknown>(raw: R): D | Promise<D>
  save<R = unknown>(store: D): R | Promise<R>
}

export interface Tokenizer {
  language: string
  normalizationCache: Map<string, string>
  tokenize: (raw: string, language?: string) => string[]
}

export interface ComplexComponent {
  tokenizer: Tokenizer
  index: IIndex
  documentsStore: IDocumentsStore
}

export interface SimpleComponents<S extends Schema = Schema> {
  validateSchema(doc: Document, schema: S): SyncOrAsyncValue<boolean>
  getDocumentIndexId(doc: Document): SyncOrAsyncValue<string>
  getDocumentProperties(doc: Document, paths: string[]): SyncOrAsyncValue<Record<string, string | number | boolean>>
  formatElapsedTime(number: bigint): SyncOrAsyncValue<number | string | object | ElapsedTime>
}

export interface SimpleOrArrayCallbackComponents {
  beforeInsert: SingleOrArray<SingleCallbackComponent>
  afterInsert: SingleOrArray<SingleCallbackComponent>
  beforeRemove: SingleOrArray<SingleCallbackComponent>
  afterRemove: SingleOrArray<SingleCallbackComponent>
  beforeUpdate: SingleOrArray<SingleCallbackComponent>
  afterUpdate: SingleOrArray<SingleCallbackComponent>
  beforeMultipleInsert: SingleOrArray<MultipleCallbackComponent>
  afterMultipleInsert: SingleOrArray<MultipleCallbackComponent>
  beforeMultipleRemove: SingleOrArray<MultipleCallbackComponent>
  afterMultipleRemove: SingleOrArray<MultipleCallbackComponent>
  beforeMultipleUpdate: SingleOrArray<MultipleCallbackComponent>
  afterMultipleUpdate: SingleOrArray<MultipleCallbackComponent>
}

export interface ArrayCallbackComponents {
  beforeInsert: SingleCallbackComponent[]
  afterInsert: SingleCallbackComponent[]
  beforeRemove: SingleCallbackComponent[]
  afterRemove: SingleCallbackComponent[]
  beforeUpdate: SingleCallbackComponent[]
  afterUpdate: SingleCallbackComponent[]
  beforeMultipleInsert: MultipleCallbackComponent[]
  afterMultipleInsert: MultipleCallbackComponent[]
  beforeMultipleRemove: MultipleCallbackComponent[]
  afterMultipleRemove: MultipleCallbackComponent[]
  beforeMultipleUpdate: MultipleCallbackComponent[]
  afterMultipleUpdate: MultipleCallbackComponent[]
}

export type Components = Partial<ComplexComponent & SimpleComponents & SimpleOrArrayCallbackComponents>

export const kInsertions = Symbol('orama.insertions')
export const kRemovals = Symbol('orama.removals')

type ProvidedTypes = Partial<{ Schema: Schema; Index: OpaqueIndex; DocumentStore: OpaqueDocumentStore }>

type Internals<S extends Schema, I extends OpaqueIndex, D extends OpaqueDocumentStore> = {
  schema: S
  tokenizer: Tokenizer
  index: IIndex<I>
  documentsStore: IDocumentsStore<D>
  data: {
    index: I
    docs: D
  }
  caches: Record<string, unknown>
  [kInsertions]: number | undefined
  [kRemovals]: number | undefined
}

export type Orama<
  P extends ProvidedTypes = { Schema: Schema; Index: OpaqueIndex; DocumentStore: OpaqueDocumentStore },
> = SimpleComponents &
  ArrayCallbackComponents &
  Internals<Schema & P['Schema'], OpaqueIndex & P['Index'], OpaqueDocumentStore & P['DocumentStore']>