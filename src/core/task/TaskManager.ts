import { HistoryItem } from "@shared/HistoryItem"
import * as vscode from "vscode"
import { Task } from "./index"

/**
 * TaskManager es responsable de gestionar múltiples tareas y mantener el contexto entre ellas.
 * Proporciona funcionalidades para:
 * - Rastrear tareas relacionadas
 * - Mantener el contexto compartido entre tareas
 * - Facilitar la transición entre tareas
 * - Mejorar la gestión de memoria de contexto
 */
export class TaskManager {
    private tasks: Map<string, TaskInfo> = new Map()
    private relatedTasks: Map<string, string[]> = new Map()
    private sharedContext: Map<string, SharedContextData> = new Map()

    /**
     * Registra una nueva tarea en el administrador
     * @param taskId ID de la tarea
     * @param task Instancia de la tarea
     * @param parentTaskId ID de la tarea padre (opcional)
     */
    registerTask(taskId: string, task: Task, parentTaskId?: string): void {
        // Registrar la tarea
        this.tasks.set(taskId, {
            task,
            createdAt: Date.now(),
            lastAccessedAt: Date.now(),
            parentTaskId
        })

        // Si tiene una tarea padre, establecer la relación
        if (parentTaskId) {
            const relatedTasks = this.relatedTasks.get(parentTaskId) || []
            relatedTasks.push(taskId)
            this.relatedTasks.set(parentTaskId, relatedTasks)

            // Compartir contexto con la tarea padre
            this.shareContextBetweenTasks(parentTaskId, taskId)
        }
    }

    /**
     * Obtiene una tarea por su ID
     * @param taskId ID de la tarea
     * @returns La instancia de la tarea o undefined si no existe
     */
    getTask(taskId: string): Task | undefined {
        const taskInfo = this.tasks.get(taskId)
        if (taskInfo) {
            // Actualizar la última vez que se accedió
            taskInfo.lastAccessedAt = Date.now()
            return taskInfo.task
        }
        return undefined
    }

    /**
     * Obtiene todas las tareas relacionadas con una tarea específica
     * @param taskId ID de la tarea
     * @returns Array de IDs de tareas relacionadas
     */
    getRelatedTasks(taskId: string): string[] {
        return this.relatedTasks.get(taskId) || []
    }

    /**
     * Comparte contexto entre dos tareas
     * @param sourceTaskId ID de la tarea fuente
     * @param targetTaskId ID de la tarea destino
     */
    async shareContextBetweenTasks(sourceTaskId: string, targetTaskId: string): Promise<void> {
        const sourceTask = this.getTask(sourceTaskId)
        const targetTask = this.getTask(targetTaskId)

        if (!sourceTask || !targetTask) {
            return
        }

        // Crear un ID único para el contexto compartido
        const sharedContextId = `${sourceTaskId}_${targetTaskId}`

        try {
            // Obtener datos de contexto relevantes de la tarea fuente
            const fileContexts = await sourceTask.getRelevantFileContexts()
            const importantConcepts = sourceTask.getImportantConcepts()

            const contextData: SharedContextData = {
                fileContexts,
                importantConcepts,
                sharedAt: Date.now()
            }

            // Guardar el contexto compartido
            this.sharedContext.set(sharedContextId, contextData)

            // Aplicar el contexto compartido a la tarea destino
            await targetTask.applySharedContext(contextData)
        } catch (error) {
            console.error(`Error al compartir contexto entre tareas ${sourceTaskId} y ${targetTaskId}:`, error)
        }
    }

    /**
     * Elimina una tarea del administrador
     * @param taskId ID de la tarea a eliminar
     */
    removeTask(taskId: string): void {
        this.tasks.delete(taskId)

        // Eliminar relaciones
        this.relatedTasks.delete(taskId)

        // Eliminar de las relaciones de otras tareas
        for (const [parentId, children] of this.relatedTasks.entries()) {
            const updatedChildren = children.filter(id => id !== taskId)
            this.relatedTasks.set(parentId, updatedChildren)
        }

        // Eliminar contextos compartidos
        for (const contextId of this.sharedContext.keys()) {
            if (contextId.includes(taskId)) {
                this.sharedContext.delete(contextId)
            }
        }
    }

    /**
     * Crea una nueva tarea relacionada con una tarea existente
     * @param parentTaskId ID de la tarea padre
     * @param context Contexto de la extensión
     * @param taskParams Parámetros para la nueva tarea
     * @returns La nueva instancia de tarea
     */
    async createRelatedTask(
        parentTaskId: string,
        context: vscode.ExtensionContext,
        taskParams: TaskCreationParams
    ): Promise<Task | undefined> {
        const parentTask = this.getTask(parentTaskId)
        if (!parentTask) {
            return undefined
        }

        // Crear una nueva tarea con el contexto de la tarea padre
        const newTaskId = Date.now().toString()

        // Aquí se crearía la nueva tarea con los parámetros adecuados
        // Esta implementación depende de cómo se inicializa Task en el sistema

        // Registrar la nueva tarea como relacionada con la tarea padre
        // this.registerTask(newTaskId, newTask, parentTaskId)

        return this.getTask(newTaskId)
    }
}

// Interfaces para el TaskManager
interface TaskInfo {
    task: Task
    createdAt: number
    lastAccessedAt: number
    parentTaskId?: string
}

interface SharedContextData {
    fileContexts: string[]
    importantConcepts: string[]
    sharedAt: number
}

interface TaskCreationParams {
    // Parámetros necesarios para crear una nueva tarea
    // Esto dependerá de la implementación específica de Task
}

// Extender la clase Task con métodos para el TaskManager
declare module "./index" {
    interface Task {
        getRelevantFileContexts(): Promise<string[]>
        getImportantConcepts(): string[]
        applySharedContext(context: SharedContextData): Promise<void>
    }
}
