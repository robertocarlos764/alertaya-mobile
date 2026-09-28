using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

namespace AlertaYA.Api.Migrations;

/// <summary>
/// COLUMNA ADICIONAL AL ESQUEMA ORIGINAL (sección 6 de la especificación):
/// Como no contamos con el SQL de referencia de las tablas existentes, no podemos confirmar si
/// <c>alerts.client_generated_id</c> ya existe en Supabase. Esta migración es el mecanismo para
/// crearla SI NO EXISTE: agrega la columna uuid nullable y un índice único compuesto
/// (user_id, client_generated_id) que garantiza la idempotencia de POST /api/alerts en base de datos.
///
/// IMPORTANTE: es la ÚNICA migración del proyecto. El resto de las tablas YA EXISTEN en la base.
///
/// Aplicación:
///   - opción A (CLI): dotnet ef database update
///   - opción B (editor SQL de Supabase): ejecutar manualmente:
///       ALTER TABLE alerts ADD COLUMN IF NOT EXISTS client_generated_id uuid;
///       CREATE UNIQUE INDEX IF NOT EXISTS IX_alerts_user_id_client_generated_id
///          ON alerts (user_id, client_generated_id);
///   Si la columna ya existe, IF NOT EXISTS la deja intacta (opción B), o bien dota el index ya
///   presente (opción A fallaría con "duplicate column" — usar la opción B en ese caso).
/// </summary>
[Migration("20260924000000_AddClientGeneratedIdToAlerts")]
public partial class AddClientGeneratedIdToAlerts : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<Guid>(
            name: "client_generated_id",
            table: "alerts",
            type: "uuid",
            nullable: true);

        migrationBuilder.CreateIndex(
            name: "IX_alerts_user_id_client_generated_id",
            table: "alerts",
            columns: new[] { "user_id", "client_generated_id" },
            unique: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropIndex(
            name: "IX_alerts_user_id_client_generated_id",
            table: "alerts");

        migrationBuilder.DropColumn(
            name: "client_generated_id",
            table: "alerts");
    }
}