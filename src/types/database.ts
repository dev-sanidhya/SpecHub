export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      workspaces: {
        Row: {
          id: string;
          name: string;
          owner_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          owner_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          owner_id?: string;
          created_at?: string;
        };
      };
      workspace_members: {
        Row: {
          id: string;
          workspace_id: string;
          user_id: string;
          role: "owner" | "editor" | "reviewer" | "viewer";
          joined_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          user_id: string;
          role: "owner" | "editor" | "reviewer" | "viewer";
          joined_at?: string;
        };
        Update: {
          role?: "owner" | "editor" | "reviewer" | "viewer";
        };
      };
      documents: {
        Row: {
          id: string;
          workspace_id: string;
          title: string;
          current_version_id: string | null;
          current_version_number: number;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          title: string;
          current_version_id?: string | null;
          current_version_number?: number;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          current_version_id?: string | null;
          current_version_number?: number;
          updated_at?: string;
        };
      };
      versions: {
        Row: {
          id: string;
          document_id: string;
          content: Json;
          version_number: number;
          ai_summary: string | null;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          document_id: string;
          content: Json;
          version_number: number;
          ai_summary?: string | null;
          created_by: string;
          created_at?: string;
        };
        Update: {
          ai_summary?: string | null;
        };
      };
      suggestions: {
        Row: {
          id: string;
          document_id: string;
          base_version_id: string;
          proposed_content: Json;
          title: string;
          description: string | null;
          status: "open" | "approved" | "rejected" | "merged";
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          document_id: string;
          base_version_id: string;
          proposed_content: Json;
          title: string;
          description?: string | null;
          status?: "open" | "approved" | "rejected" | "merged";
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: "open" | "approved" | "rejected" | "merged";
          updated_at?: string;
        };
      };
      reviews: {
        Row: {
          id: string;
          suggestion_id: string;
          reviewer_id: string;
          decision: "approved" | "rejected" | "changes_requested";
          comment: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          suggestion_id: string;
          reviewer_id: string;
          decision: "approved" | "rejected" | "changes_requested";
          comment?: string | null;
          created_at?: string;
        };
        Update: never;
      };
      comments: {
        Row: {
          id: string;
          suggestion_id: string | null;
          version_id: string | null;
          author_id: string;
          body: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          suggestion_id?: string | null;
          version_id?: string | null;
          author_id: string;
          body: string;
          created_at?: string;
        };
        Update: {
          body?: string;
        };
      };
    };
  };
}

export type Workspace = Database["public"]["Tables"]["workspaces"]["Row"];
export type Document = Database["public"]["Tables"]["documents"]["Row"];
export type Version = Database["public"]["Tables"]["versions"]["Row"];
export type Suggestion = Database["public"]["Tables"]["suggestions"]["Row"];
export type Review = Database["public"]["Tables"]["reviews"]["Row"];
export type Comment = Database["public"]["Tables"]["comments"]["Row"];
export type WorkspaceMember = Database["public"]["Tables"]["workspace_members"]["Row"];
