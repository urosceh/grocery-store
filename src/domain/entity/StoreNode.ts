import { StoreNodeDoc } from '../../database/model/StoreNode.model';

export class StoreNode {
  private _id: string;
  private _displayName: string;
  private _kind: string;
  private _parentId: string | null;
  private _ancestorIds: string[];

  constructor(node: StoreNodeDoc) {
    this._id = node._id.toString();
    this._displayName = node.displayName;
    this._kind = node.kind;
    this._parentId = node.parentId?.toString() ?? null;
    this._ancestorIds = node.ancestorIds.map((id) => id.toString());
  }

  public get id(): string {
    return this._id;
  }

  public get displayName(): string {
    return this._displayName;
  }

  public get kind(): string {
    return this._kind;
  }

  public get parentId(): string | null {
    return this._parentId;
  }

  public get ancestorIds(): string[] {
    return this._ancestorIds;
  }

  public toDto() {
    return {
      id: this._id,
      displayName: this._displayName,
      kind: this._kind,
    };
  }
}
